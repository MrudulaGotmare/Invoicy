import os
import json
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
    with open("extracted_data.txt", "w") as f:
        for box, text, score in zip(boxes, txts, scores):
            f.write(f"Box: {box}, Text: {text}, Confidence: {score}\n")
            extracted_text.append(f"{text} ({score:.2f})")

    # Save the extracted text without bounding box information to a separate file
    with open("extracted_text.txt", "w") as f:
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
# Function to calculate cost based on token usage
def calculate_cost(usage: dict) -> float:
    input_cost_per_token = 0.50 / 1_000_000  # $0.50 per 1 million tokens
    output_cost_per_token = 1.50 / 1_000_000  # $1.50 per 1 million tokens

    input_tokens = usage["prompt_tokens"]
    output_tokens = usage["completion_tokens"]

    total_cost = (input_tokens * input_cost_per_token) + (output_tokens * output_cost_per_token)
    return total_cost

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
from reportlab.platypus import Paragraph, PageBreak
from reportlab.lib.styles import getSampleStyleSheet

def process_invoice_images(folder_path, output_folder="annotated_images", final_pdf_path="final_report.pdf"):
    # Ensure the folder path exists
    if not os.path.exists(folder_path):
        raise ValueError(f"Folder path '{folder_path}' does not exist.")

    # Find all image files and PDF files in the folder
    files = [
        os.path.join(folder_path, f) for f in os.listdir(folder_path)
        if f.lower().endswith('.jpg') or f.lower().endswith('.png') or f.lower().endswith('.pdf')
    ]

    # Create a canvas object for the final PDF
    c = canvas.Canvas(final_pdf_path, pagesize=letter)

    # Process each file
    for file_path in files:
        print(f"Processing file: {file_path}")

        # Initialize pdf_images list
        pdf_images = []

        # Convert PDF to images if the file is a PDF
        if file_path.lower().endswith('.pdf'):
            pdf_images = pdf_to_images(file_path)
        else:
            pdf_images = [file_path]

        for image_path in pdf_images:
            print(f"Processing image: {image_path}")
            extracted_text, annotated_image_path, avg_confidence = extract_text_from_image(image_path, output_folder=output_folder)

            # Check if the annotated image was saved correctly
            if not os.path.exists(annotated_image_path):
                print(f"Error: Annotated image not found at {annotated_image_path}")
                continue

            # Process extracted text with OpenAI
            result = process_text(extracted_text, invoice_schema)
            response_content = result["response_content"]

            # Print or save the response as needed
            print("Extracted Text:")
            print(extracted_text)

            print("\nResponse from OpenAI:")
            print(response_content)

            # Print average confidence
            print(f"\nAverage Confidence: {avg_confidence:.2f}")

            # Add annotated image to the PDF (fit to full page)
            c.drawImage(annotated_image_path, 0, 0, width=c._pagesize[0], height=c._pagesize[1])
            c.showPage()  # Add a new page for the annotated image

            # Add response from OpenAI to the PDF
            styles = getSampleStyleSheet()
            style = styles["Normal"]
            style.fontName = 'Helvetica'
            style.leading = 7  # Adjust leading for better readability

            # Split response content into lines
            response_lines = response_content.split('\n')

            # Add the response lines as paragraphs, handling page breaks
            c.drawString(50, c._pagesize[1] - 50, "Response from OpenAI:")
            y_position = c._pagesize[1] - 100  # Starting y position for text

            for line in response_lines:
                response_paragraph = Paragraph(line, style)
                response_paragraph.wrap(c._pagesize[0] - 100, c._pagesize[1] - 100)

                # Check if the paragraph fits on the current page
                if y_position - response_paragraph.height < 100:
                    c.showPage()  # Add a new page if the paragraph does not fit
                    y_position = c._pagesize[1] - 100  # Reset y position

                response_paragraph.drawOn(c, 50, y_position)
                y_position -= response_paragraph.height + style.leading

            c.showPage()  # Add a new page for the next invoice

    # Save the final PDF
    c.save()
# Example usage
folder_path = "vert1"
output_folder = "annotated_images"
process_invoice_images(folder_path, output_folder, "final_report.pdf")
