# d2.py
import os
import json
import sys
from PIL import Image, ImageDraw, ImageFont
from openai import OpenAI
from paddleocr import PaddleOCR
from pdf2image import convert_from_path
from datetime import datetime
import traceback

# Initialize OpenAI client and PaddleOCR
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")
client = OpenAI(api_key=api_key)
ocr = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False)

# Function to load JSON schema
def load_json_schema(schema_file: str) -> dict:
    with open(schema_file, 'r') as file:
        return json.load(file)

# Load the JSON schema
invoice_schema = load_json_schema('invoice_schema.json')

def print_progress(step):
    print(f"Progress: {step}", flush=True)

# Function to try parsing dates in multiple formats
def parse_date(date_str, reference_date=None):
    formats = ['%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d', '%Y-%m-%d']
    for fmt in formats:
        try:
            parsed_date = datetime.strptime(date_str, fmt)
            if reference_date and parsed_date.year != reference_date.year:
                continue
            return parsed_date.strftime('%Y-%m-%d')
        except ValueError:
            continue
    return date_str  # Return original string if parsing fails

# Function to extract text from image using PaddleOCR and save annotated image
def extract_text_from_image(image_path, output_folder="annotated_images"):
    try:
        # Perform OCR on the image
        result = ocr.ocr(image_path, cls=True)

        # Extract relevant information from OCR result
        boxes = []
        txts = []
        scores = []
        for idx in range(len(result)):
            res = result[idx]
            for line in res:
                boxes.append(line[0])
                txts.append(line[1][0])
                scores.append(line[1][1])

        # Calculate average confidence score
        avg_confidence = sum(scores) / len(scores) if scores else 0.0

        # Save extracted data to a file
        os.makedirs(output_folder, exist_ok=True)
        extracted_data_path = os.path.join(output_folder, "extracted_data.txt")
        with open(extracted_data_path, "w", encoding='utf-8') as f:
            for box, text, score in zip(boxes, txts, scores):
                f.write(f"Box: {box}, Text: {text}, Confidence: {score}\n")

        # Annotate the image with bounding boxes and save
        image = Image.open(image_path)
        draw = ImageDraw.Draw(image)
        font_path = 'arial.ttf'
        for box, text, score in zip(boxes, txts, scores):
            if score >= 0.97:
                text_color = (0, 255, 0)  # Green for high confidence
            else:
                text_color = (255, 0, 0)   # Red for low confidence
            draw.polygon([
                box[0][0], box[0][1],
                box[1][0], box[1][1],
                box[2][0], box[2][1],
                box[3][0], box[3][1]
            ], outline=text_color)
            draw.text((box[0][0], box[0][1] - 10), f"{text} ({score:.2f})", font=ImageFont.truetype(font_path, size=14), fill=text_color)

        annotated_image_path = os.path.join(output_folder, os.path.splitext(os.path.basename(image_path))[0] + "_annotated.jpg")
        image.save(annotated_image_path)

        # Print the extracted text
        extracted_text = ' '.join(txts)
        print(f"Extracted Text: {extracted_text}")

        return extracted_text, annotated_image_path, avg_confidence

    except Exception as e:
        print(f"Error extracting text from {image_path}: {e}")
        return "", "", 0.0
    
# Function to process text and return extracted details as plain text
def process_text(text: str, invoice_schema: dict) -> dict:
    extra_prompt = [
        "You are an Invoice Extraction Specialist. Your task is to extract key details from the OCR text provided. We are using the PaddleOCR engine to perform extraction of text from image.",
        "Handle potential ambiguities in the invoice format, such as multiple pages belonging to the same invoice, by ensuring that invoice details are correctly aggregated.",
        "The OCR data has been extracted using the PaddleOCR engine. Match all particulars from the extracted OCR data with the provided JSON schema and return structured data.",
        "The JSON schema specifies the particulars and data types for accurate comprehension of the extracted OCR data.",
        "Respond only with the structured data in JSON format as per the schema. Do not include any explanations."
    ]

    prompt_content = "\n".join(extra_prompt) + "\n\n" + "Use the provided JSON Schema as a reference for the expected structure of the extracted information. The schema is as follows:\n" + json.dumps(invoice_schema, indent=2) + "\n\nExtracted Text:\n" + text

    with open('gptextract.txt', 'w') as f:
        f.write(prompt_content)

    try:
        response = client.chat.completions.create(
            model='gpt-3.5-turbo-0125',
            messages=[
                {"role": "user", "content": prompt_content}
            ],
            max_tokens=4096,
            temperature=0.0
        )

        message_content = response.choices[0].message.content

        if not message_content.strip():
            raise ValueError("Empty response from OpenAI")

        structured_data = json.loads(message_content)

        # Print the structured data
        print(f"Structured Data: {json.dumps(structured_data, indent=2)}")

        return {
            "response_content": message_content,
            "token_usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens
            }
        }

    except Exception as e:
        print(f"Error processing text: {e}")
        return {
            "response_content": f"Error processing text: {e}",
            "token_usage": {
                "prompt_tokens": 0,
                "completion_tokens": 0
            }
        }

# Function to convert USD to INR
def usd_to_inr(amount_usd: float) -> float:
    exchange_rate = 83.5  # 1 USD = 83.5 INR
    amount_inr = amount_usd * exchange_rate
    return amount_inr

# Function to convert PDF to images
def pdf_to_images(pdf_path, output_folder="pdf_images"):
    os.makedirs(output_folder, exist_ok=True)

    images = convert_from_path(pdf_path)
    image_paths = []
    for i, image in enumerate(images):
        image_path = os.path.join(output_folder, f"page_{i + 1}.jpg")
        image.save(image_path, 'JPEG')
        image_paths.append(image_path)
    return image_paths

# Function to merge extracted data for invoices with the same invoice number
def merge_invoice_data(extraction_results):
    merged_data = {}
    for result in extraction_results:
        invoice_number = result['structured_data'].get('invoice_number')
        if invoice_number:
            if invoice_number not in merged_data:
                merged_data[invoice_number] = {
                    "extracted_text": "",
                    "structured_data": result['structured_data'],
                    "avg_confidence": 0.0,
                    "page_count": 0
                }
            merged_data[invoice_number]["extracted_text"] += result['extracted_text'] + "\n"
            merged_data[invoice_number]["avg_confidence"] += result['avg_confidence']
            merged_data[invoice_number]["page_count"] += 1

            # Merge items from all pages
            if "items" not in merged_data[invoice_number]["structured_data"]:
                merged_data[invoice_number]["structured_data"]["items"] = []
            merged_data[invoice_number]["structured_data"]["items"].extend(result['structured_data'].get("items", []))

    # Calculate average confidence for merged data
    for invoice_number, data in merged_data.items():
        data["avg_confidence"] /= data["page_count"]

    return merged_data

# Function to process invoice images and print the final results
def process_invoice_images(input_path, output_folder="annotated_images"):
    os.makedirs(output_folder, exist_ok=True)

    print_progress("Extracting information")

    if os.path.isfile(input_path):
        files = [input_path]
    elif os.path.isdir(input_path):
        files = [
            os.path.join(input_path, f) for f in os.listdir(input_path)
            if f.lower().endswith('.jpg') or f.lower().endswith('.png') or f.lower().endswith('.pdf')
        ]
    else:
        print(f"Invalid input path: {input_path}")
        sys.exit(1)

    pdf_files = [f for f in files if f.lower().endswith('.pdf')]
    for pdf_file in pdf_files:
        pdf_images = pdf_to_images(pdf_file, output_folder=output_folder)
        files.remove(pdf_file)
        files.extend(pdf_images)

    extraction_results = []
    for file in files:
        if file.lower().endswith('.jpg') or file.lower().endswith('.png'):
            try:
                extracted_text, annotated_image_path, avg_confidence = extract_text_from_image(file, output_folder=output_folder)
                if extracted_text:
                    print_progress("Collating information")
                    structured_data = process_text(extracted_text, invoice_schema)
                    extraction_results.append({
                        "file_name": os.path.basename(file),
                        "extracted_text": extracted_text,
                        "annotated_image_path": annotated_image_path,
                        "structured_data": structured_data,
                        "avg_confidence": avg_confidence
                    })
                else:
                    print(f"No valid text found in {file}. Skipping.")
            except Exception as e:
                print(f"Error processing {file}: {e}")

    if extraction_results:
        print_progress("Ready to present")
        merged_data = merge_invoice_data(extraction_results)
        return merged_data

    return {}

def is_single_page_pdf(file_path):
    try:
        images = convert_from_path(file_path)
        return len(images) == 1
    except Exception as e:
        print(f"Error checking if PDF is single page: {e}")
        return False
# At the end of the main block in d2.py
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python d2.py <image_path or folder_path>"}))
        sys.exit(1)

    input_path = sys.argv[1]
    try:
        print_progress("Extracting information")
        if input_path.lower().endswith('.pdf'):
            pdf_images = pdf_to_images(input_path)
            for image_path in pdf_images:
                extracted_text, annotated_image_path, avg_confidence = extract_text_from_image(image_path)
                print_progress("Collating information")
                structured_data = process_text(extracted_text, invoice_schema)

                output_data = {
                    "file_name": os.path.basename(image_path),
                    "extracted_text": extracted_text,
                    "annotated_image_path": annotated_image_path,
                    "structured_data": structured_data,
                    "avg_confidence": avg_confidence
                }

                print("Extracted Text:", extracted_text)
                print("Structured Data:", json.dumps(structured_data, indent=2))
                print_progress("Ready to present")
                print(f"output data: {json.dumps(output_data)}")
        else:
            extracted_text, annotated_image_path, avg_confidence = extract_text_from_image(input_path)
            print_progress("Collating information")
            structured_data = process_text(extracted_text, invoice_schema)

            output_data = {
                "file_name": os.path.basename(input_path),
                "extracted_text": extracted_text,
                "annotated_image_path": annotated_image_path,
                "structured_data": structured_data,
                "avg_confidence": avg_confidence
            }

            print_progress("Ready to present")
            print(f"output data: {json.dumps(structured_data)}")
    except Exception as e:
        error_info = {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_info), file=sys.stderr)
        sys.exit(1)

# import os
# import json
# import sys
# from PIL import Image, ImageDraw, ImageFont
# from openai import OpenAI
# from paddleocr import PaddleOCR
# from pdf2image import convert_from_path
# from datetime import datetime
# from reportlab.lib.pagesizes import letter
# from reportlab.pdfgen import canvas
# import traceback

# # Initialize OpenAI client and PaddleOCR
# api_key = os.getenv("OPENAI_API_KEY")
# if not api_key:
#     raise ValueError("OPENAI_API_KEY not found in environment variables")
# client = OpenAI(api_key=api_key)
# ocr = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False)

# # Function to load JSON schema
# def load_json_schema(schema_file: str) -> dict:
#     with open(schema_file, 'r') as file:
#         return json.load(file)

# # Load the JSON schema
# invoice_schema = load_json_schema('invoice_schema.json')

# # Function to try parsing dates in multiple formats
# def parse_date(date_str, reference_date=None):
#     formats = ['%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d', '%Y-%m-%d']
#     for fmt in formats:
#         try:
#             parsed_date = datetime.strptime(date_str, fmt)
#             if reference_date and parsed_date.year != reference_date.year:
#                 continue
#             return parsed_date.strftime('%Y-%m-%d')
#         except ValueError:
#             continue
#     return date_str  # Return original string if parsing fails

# # Function to extract text from image using PaddleOCR and save annotated image
# def extract_text_from_image(image_path, output_folder="annotated_images"):
#     try:
#         # Perform OCR on the image
#         result = ocr.ocr(image_path, cls=True)

#         # Extract relevant information from OCR result
#         boxes = []
#         txts = []
#         scores = []
#         for idx in range(len(result)):
#             res = result[idx]
#             for line in res:
#                 boxes.append(line[0])
#                 txts.append(line[1][0])
#                 scores.append(line[1][1])

#         # Calculate average confidence score
#         avg_confidence = sum(scores) / len(scores) if scores else 0.0

#         # Save extracted data to a file
#         os.makedirs(output_folder, exist_ok=True)
#         extracted_data_path = os.path.join(output_folder, "extracted_data.txt")
#         with open(extracted_data_path, "w", encoding='utf-8') as f:
#             for box, text, score in zip(boxes, txts, scores):
#                 f.write(f"Box: {box}, Text: {text}, Confidence: {score}\n")

#         # Annotate the image with bounding boxes and save
#         image = Image.open(image_path)
#         draw = ImageDraw.Draw(image)
#         font_path = 'arial.ttf'
#         for box, text, score in zip(boxes, txts, scores):
#             if score >= 0.97:
#                 text_color = (0, 255, 0)  # Green for high confidence
#             else:
#                 text_color = (255, 0, 0)   # Red for low confidence
#             draw.polygon([
#                 box[0][0], box[0][1],
#                 box[1][0], box[1][1],
#                 box[2][0], box[2][1],
#                 box[3][0], box[3][1]
#             ], outline=text_color)
#             draw.text((box[0][0], box[0][1] - 10), f"{text} ({score:.2f})", font=ImageFont.truetype(font_path, size=14), fill=text_color)
        
#         annotated_image_path = os.path.join(output_folder, os.path.splitext(os.path.basename(image_path))[0] + "_annotated.jpg")
#         image.save(annotated_image_path)
        
#         return ' '.join(txts), annotated_image_path, avg_confidence

#     except Exception as e:
#         print(f"Error extracting text from {image_path}: {e}")
#         return "", "", 0.0
    
# # Function to process text and return extracted details as plain text
# def process_text(text: str, invoice_schema: dict) -> dict:
#     extra_prompt = [
#         "You are an Invoice Extraction Specialist. Your task is to extract key details from the OCR text provided. We are using the PaddleOCR engine to perform extraction of text from image.",
#         "Handle potential ambiguities in the invoice format, such as multiple pages belonging to the same invoice, by ensuring that invoice details are correctly aggregated.",
#         "The OCR data has been extracted using the PaddleOCR engine. Match all particulars from the extracted OCR data with the provided JSON schema and return structured data.",
#         "The JSON schema specifies the particulars and data types for accurate comprehension of the extracted OCR data.",
#         "Respond only with the structured data in JSON format as per the schema. Do not include any explanations."
#     ]

#     prompt_content = "\n".join(extra_prompt) + "\n\n" + "Use the provided JSON Schema as a reference for the expected structure of the extracted information. The schema is as follows:\n" + json.dumps(invoice_schema, indent=2) + "\n\nExtracted Text:\n" + text

#     with open('gptextract.txt', 'w') as f:
#         f.write(prompt_content)

#     try:
#         response = client.chat.completions.create(
#             model='gpt-3.5-turbo-0125',
#             messages=[
#                 {"role": "user", "content": prompt_content}
#             ],
#             max_tokens=4096,
#             temperature=0.0
#         )

#         message_content = response.choices[0].message.content
        
#         if not message_content.strip():
#             raise ValueError("Empty response from OpenAI")

#         structured_data = json.loads(message_content)

#         return {
#             "response_content": message_content,
#             "token_usage": {
#                 "prompt_tokens": response.usage.prompt_tokens,
#                 "completion_tokens": response.usage.completion_tokens
#             }
#         }

#     except Exception as e:
#         print(f"Error processing text: {e}")
#         return {
#             "response_content": f"Error processing text: {e}",
#             "token_usage": {
#                 "prompt_tokens": 0,
#                 "completion_tokens": 0
#             }
#         }

# # Function to convert USD to INR
# def usd_to_inr(amount_usd: float) -> float:
#     exchange_rate = 83.5  # 1 USD = 83.5 INR
#     amount_inr = amount_usd * exchange_rate
#     return amount_inr

# # Function to convert PDF to images
# def pdf_to_images(pdf_path, output_folder="pdf_images"):
#     os.makedirs(output_folder, exist_ok=True)
    
#     images = convert_from_path(pdf_path)
#     image_paths = []
#     for i, image in enumerate(images):
#         image_path = os.path.join(output_folder, f"page_{i + 1}.jpg")
#         image.save(image_path, 'JPEG')
#         image_paths.append(image_path)
#     return image_paths

# # Function to process invoice images and generate a final report PDF
# def process_invoice_images(input_path, output_folder="annotated_images", final_pdf_path="final_report.pdf"):
#     os.makedirs(output_folder, exist_ok=True)

#     if os.path.isfile(input_path):  # Single file input
#         files = [input_path]
#     elif os.path.isdir(input_path):  # Directory input
#         files = [
#             os.path.join(input_path, f) for f in os.listdir(input_path)
#             if f.lower().endswith('.jpg') or f.lower().endswith('.png') or f.lower().endswith('.pdf')
#         ]
#     else:
#         print(f"Invalid input path: {input_path}")
#         sys.exit(1)

#     pdf_files = [f for f in files if f.lower().endswith('.pdf')]
#     for pdf_file in pdf_files:
#         pdf_images = pdf_to_images(pdf_file, output_folder=output_folder)
#         files.remove(pdf_file)
#         files.extend(pdf_images)

#     extraction_results = []
#     for file in files:
#         if file.lower().endswith('.jpg') or file.lower().endswith('.png'):
#             try:
#                 extracted_text, annotated_image_path, avg_confidence = extract_text_from_image(file, output_folder=output_folder)
#                 if extracted_text:
#                     structured_data = process_text(extracted_text, invoice_schema)
#                     extraction_results.append({
#                         "file_name": os.path.basename(file),
#                         "extracted_text": extracted_text,
#                         "annotated_image_path": annotated_image_path,
#                         "structured_data": structured_data,
#                         "avg_confidence": avg_confidence
#                     })
#                 else:
#                     print(f"No valid text found in {file}. Skipping.")
#             except Exception as e:
#                 print(f"Error processing {file}: {e}")

#     if extraction_results:
#         c = canvas.Canvas(final_pdf_path, pagesize=letter)
#         c.setFont("Helvetica-Bold", 16)
#         c.drawString(100, 750, "Invoice Extraction Report")
#         c.setFont("Helvetica", 12)

#         y_position = 700
#         for result in extraction_results:
#             c.drawString(100, y_position, f"File Name: {result['file_name']}")
#             c.drawString(100, y_position - 15, f"Average Confidence: {result['avg_confidence']:.2f}")
#             c.drawString(100, y_position - 30, "Extracted Text:")
#             lines = result['extracted_text'].split('\n')
#             y_position -= 45
#             for line in lines:
#                 c.drawString(120, y_position, line)
#                 y_position -= 15
#             c.drawString(100, y_position, "Structured Data (JSON):")
#             json_text = json.dumps(result['structured_data'], indent=2)
#             json_lines = json_text.split('\n')
#             y_position -= 30
#             for line in json_lines:
#                 c.drawString(120, y_position, line)
#                 y_position -= 15
#             c.drawString(100, y_position, "Annotated Image:")
#             c.drawImage(result['annotated_image_path'], 100, y_position - 100, width=400, height=300)
#             y_position -= 400
#             if y_position < 100:
#                 c.showPage()
#                 c.setFont("Helvetica-Bold", 16)
#                 c.drawString(100, 750, "Invoice Extraction Report (continued)")
#                 c.setFont("Helvetica", 12)
#                 y_position = 700

#         c.save()
#         print(f"Final report saved as: {final_pdf_path}")
#     else:
#         print("No valid images found for processing.")

# # Main function to execute the script
# if __name__ == "__main__":
#     if len(sys.argv) < 2:
#         print(json.dumps({"error": "Usage: python d2.py <image_path or folder_path>"}))
#         sys.exit(1)

#     input_path = sys.argv[1]
#     try:
#         extracted_text, annotated_image_path, avg_confidence = extract_text_from_image(input_path)
#         structured_data = process_text(extracted_text, invoice_schema)
        
#         output_data = {
#             "file_name": os.path.basename(input_path),
#             "extracted_text": extracted_text,
#             "annotated_image_path": annotated_image_path,
#             "structured_data": structured_data,
#             "avg_confidence": avg_confidence
#         }
        
#         print("output data:", json.dumps(structured_data))
#     except Exception as e:
#         error_info = {
#             "error": str(e),
#             "traceback": traceback.format_exc()
#         }
#         print(json.dumps(error_info), file=sys.stderr)
#         sys.exit(1)