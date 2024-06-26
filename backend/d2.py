import os
import json
import sys
from PIL import Image, ImageDraw, ImageFont
from openai import OpenAI
from paddleocr import PaddleOCR
from pdf2image import convert_from_path
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.platypus import Preformatted, Frame, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch

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

# Helper function to try parsing dates in multiple formats
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
    # If parsing fails, return the original string
    return date_str

# Function to extract text from image using PaddleOCR and save annotated image
def extract_text_from_image(image_path, output_folder="annotated_images"):
    # Perform OCR on the image
    result = ocr.ocr(image_path, cls=True)

    # Extract the boxes, texts, and scores from the nested list structure
    boxes = []
    txts = []
    scores = []

    for outer_list in result:
        for inner_list in outer_list:
            # Extract box coordinates
            box_coords = None
            for item in inner_list:
                if isinstance(item, list):
                    box_coords = item
                    break

            # Extract text and score
            text = None
            score = None
            for item in inner_list:
                if isinstance(item, tuple) and len(item) == 2:
                    text = item[0]
                    score = item[1]
                    break

            # Append to lists if both text and score are found
            if box_coords is not None and text is not None and score is not None:
                boxes.append(box_coords)
                txts.append(text)
                scores.append(score)

    # Calculate average confidence score
    avg_confidence = sum(scores) / len(scores) if scores else 0.0

    # Save the extracted text with bounding box information to a file
    extracted_text = []
    with open(os.path.join(output_folder, "extracted_data.txt"), "w") as f:
        for box, text, score in zip(boxes, txts, scores):
            f.write(f"Box: {box}, Text: {text}, Confidence: {score}\n")
            extracted_text.append(f"{text} ({score:.2f})")

    # Save the extracted text without bounding box information to a separate file
    with open(os.path.join(output_folder, "extracted_text.txt"), "w") as f:
        for text, score in zip(txts, scores):
            f.write(f"Text: {text}, Confidence: {score}\n")

    # Annotate the image with bounding boxes and confidence scores
    image = Image.open(image_path)
    image = image.convert("RGB")  # Convert image to RGB mode

    font_path = 'arial.ttf'

    # Draw bounding boxes with color coding based on confidence
    draw = ImageDraw.Draw(image)
    for box, text, score in zip(boxes, txts, scores):
        if score >= 0.97:
            text_color = (0, 255, 0)  # Green for high confidence
        else:
            text_color = (255, 0, 0)   # Red for low confidence
        
        # Convert box coordinates to tuple format
        box = [(box[0][0], box[0][1]), (box[1][0], box[1][1]), (box[2][0], box[2][1]), (box[3][0], box[3][1])]

        # Draw the bounding box
        draw.polygon(box, outline=text_color)
        
        # Draw the text
        draw.text((box[0][0], box[0][1] - 10), f"{text} ({score:.2f})", font=ImageFont.truetype(font_path, size=14), fill=text_color)

    # Create the output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)

    # Save the annotated image with bounding boxes and side panel
    annotated_image_name = os.path.splitext(os.path.basename(image_path))[0] + "_annotated.jpg"
    annotated_image_path = os.path.join(output_folder, annotated_image_name)
    image.save(annotated_image_path)

    return ' '.join(extracted_text), annotated_image_path, avg_confidence

# Function to process text and return extracted details as plain text
def process_text(text: str, invoice_schema: dict) -> dict:
    extra_prompt = [
        "You are an Invoice Extraction Specialist. Your task is to extract key details from the OCR text provided. We are using the PaddleOCR engine to perform extraction of text from image.",
        "Handle potential ambiguities in the invoice format, such as multiple pages belonging to the same invoice, by ensuring that invoice details are correctly aggregated.",
        "The OCR data has been extracted using the PaddleOCR engine. Match all particulars from the extracted OCR data with the provided JSON schema and return structured data.",
        "The JSON schema specifies the particulars and data types for accurate comprehension of the extracted OCR data.",
        "Respond only with the structured data in JSON format as per the schema. Do not include any explanations."
    ]

    # Combine extra prompt with schema and instructions
    prompt_content = "\n".join(extra_prompt) + "\n\n" + "Use the provided JSON Schema as a reference for the expected structure of the extracted information. The schema is as follows:\n" + json.dumps(invoice_schema, indent=2) + "\n\nExtracted Text:\n" + text

    # Save the prompt content to gptextract.txt
    with open('gptextract.txt', 'w') as f:
        f.write(prompt_content)

    try:
        response = client.chat.completions.create(
            model='gpt-3.5-turbo-0125',
            messages=[
                {"role": "user", "content": prompt_content}
            ],
            max_tokens=4096,
            temperature=0.0  # Set temperature to 0 to avoid hallucination
        )

        # Extract the plain text content from the response
        message_content = response.choices[0].message.content
        
        if not message_content.strip():  # Check if response content is empty or whitespace
            raise ValueError("Empty response from OpenAI")

        print(f"Message content from OpenAI:\n{message_content}")

        structured_data = json.loads(message_content)

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
    # Create the output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    images = convert_from_path(pdf_path)
    image_paths = []
    for i, image in enumerate(images):
        image_path = os.path.join(output_folder, f"page_{i + 1}.jpg")
        image.save(image_path, 'JPEG')
        image_paths.append(image_path)
    return image_paths

# Function to process invoice images and generate a final report PDF
def process_invoice_images(folder_path, output_folder="annotated_images", final_pdf_path="final_report.pdf"):
    # Ensure the folder path exists
    if not os.path.exists(folder_path):
        raise ValueError(f"Folder path '{folder_path}' does not exist.")

    # Find all image files and PDF files in the folder
    files = [
        os.path.join(folder_path, f) for f in os.listdir(folder_path)
        if f.lower().endswith('.jpg') or f.lower().endswith('.png') or f.lower().endswith('.pdf')
    ]

    # Convert PDFs to images
    pdf_files = [f for f in files if f.lower().endswith('.pdf')]
    for pdf_file in pdf_files:
        pdf_images = pdf_to_images(pdf_file, output_folder=output_folder)
        files.remove(pdf_file)
        files.extend(pdf_images)

    # Process each image file
    extraction_results = []
    for file in files:
        if file.lower().endswith('.jpg') or file.lower().endswith('.png'):
            try:
                extracted_text, annotated_image_path, avg_confidence = extract_text_from_image(file, output_folder=output_folder)
                structured_data = process_text(extracted_text, invoice_schema)
                extraction_results.append({
                    "file_name": os.path.basename(file),
                    "extracted_text": extracted_text,
                    "annotated_image_path": annotated_image_path,
                    "structured_data": structured_data,
                    "avg_confidence": avg_confidence
                })
            except Exception as e:
                print(f"Error processing {file}: {e}")

    # Generate a final report PDF
    if extraction_results:
        c = canvas.Canvas(final_pdf_path, pagesize=letter)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(100, 750, "Invoice Extraction Report")
        c.setFont("Helvetica", 12)

        y_position = 700
        for result in extraction_results:
            c.drawString(100, y_position, f"File Name: {result['file_name']}")
            c.drawString(100, y_position - 15, f"Average Confidence: {result['avg_confidence']:.2f}")
            c.drawString(100, y_position - 30, "Extracted Text:")
            lines = result['extracted_text'].split('\n')
            y_position -= 45
            for line in lines:
                c.drawString(120, y_position, line)
                y_position -= 15
            c.drawString(100, y_position, "Structured Data (JSON):")
            json_text = json.dumps(result['structured_data'], indent=2)
            json_lines = json_text.split('\n')
            y_position -= 30
            for json_line in json_lines:
                c.drawString(120, y_position, json_line)
                y_position -= 15
            c.showPage()
            y_position = 750
        c.save()

        return final_pdf_path

    return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python d2.py <image_path or folder_path>")
        sys.exit(1)

    input_path = sys.argv[1]
    if os.path.isdir(input_path):
        final_report_pdf = process_invoice_images(input_path)
        if final_report_pdf:
            print(f"Final report PDF generated: {final_report_pdf}")
        else:
            print("Error generating final report PDF.")
    elif os.path.isfile(input_path):
        try:
            extracted_text, annotated_image_path, avg_confidence = extract_text_from_image(input_path)
            structured_data = process_text(extracted_text, invoice_schema)
            print(f"Extracted Text: {extracted_text}")
            print(f"Structured Data (JSON):\n{json.dumps(structured_data, indent=2)}")
            print(f"Average Confidence: {avg_confidence:.2f}")
        except Exception as e:
            print(f"Error processing {input_path}: {e}")
    else:
        print(f"Invalid input path: {input_path}")
        sys.exit(1)
