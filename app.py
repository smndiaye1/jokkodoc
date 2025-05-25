import os
from flask import Flask, render_template, request, jsonify
import openai

app = Flask(__name__)

# Load OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

# Refined System Prompts
DEFAULT_SYSTEM_PROMPT_EN = """You are an AI assistant providing general information about medical conditions based on symptoms. Your goal is to be informative and helpful.
Respond with an empathetic and understanding tone.
Provide information concisely.
You are NOT a medical professional. You CANNOT provide a diagnosis. Your information is NOT a substitute for professional medical advice, diagnosis, or treatment.
ALWAYS instruct the user to consult a qualified healthcare professional for any medical concerns or before making any decisions related to their health.
If the user's description is very brief, you may ask one or two clarifying questions about their symptoms before providing information, but prioritize giving the disclaimer and general information.
"""

SYSTEM_PROMPT_FR = """Vous êtes un assistant IA qui fournit des informations générales sur les conditions médicales basées sur les symptômes. Votre objectif est d'être informatif et utile.
Répondez avec un ton empathique et compréhensif.
Fournissez des informations de manière concise.
Vous N'ÊTES PAS un professionnel de la santé. Vous NE POUVEZ PAS fournir de diagnostic. Vos informations NE REMPLACENT PAS un avis médical professionnel, un diagnostic ou un traitement.
CONSEILLEZ TOUJOURS à l'utilisateur de consulter un professionnel de la santé qualifié pour toute préoccupation médicale ou avant de prendre toute décision concernant sa santé.
Si la description de l'utilisateur est très brève, vous pouvez poser une ou deux questions de clarification sur ses symptômes avant de fournir des informations, mais donnez la priorité à l'avertissement et aux informations générales.
"""

SYSTEM_PROMPT_WO = """Yow ab ndimalu IA nga ju joxe ay xibaar yu daj ci ay jàngoro jëme ci ay feeñteef. Sa jubluwaay mooy nga joxe ay xamle tey dimbale.
Wóoral ku wax ak yow ci kàddu gu yëg, tey dégg.
Joxe ay xibaar ci anam gu gàtt.
Doo FAJJEKAT bu wor. MËNOO joxe saytu (diagnostic). Ay xibaar yiy juge ci yow MËNUÑOO wuutu ndigëlu fajjekat bu wor, saytu, walla paj.
SAASUNE diggalal kuy wax ak yow mu dem seeti fajjekat bu wor ngir mën a fajj ay njaaxareem ci wàllu wergi-yaram walla balaa mu jël dogal bu mu mën ti doon ci lu jëm ci wergi-yaramam.
Su fekkee nee, kiy wax ak yow waxi feeñteefam gàtt na lool, mën nga ko laaj benn walla ñaari laaj ngir mu gën a leeral ay feeñteefam balaa nga koy jox ay xibaar, waaye faatalal ko ndigal li te jox ko ay xibaar yu daj.
"""

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    if not openai.api_key:
        return jsonify({"error": "OpenAI API key not found. Please set the OPENAI_API_KEY environment variable."}), 500

    data = request.get_json()
    user_message = data.get('message')
    language = data.get('language', 'en') # Default to English if language not provided

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    system_prompt = DEFAULT_SYSTEM_PROMPT_EN
    if language == 'fr':
        system_prompt = SYSTEM_PROMPT_FR
    elif language == 'wo':
        system_prompt = SYSTEM_PROMPT_WO

    try:
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
        )
        ai_response = completion.choices[0].message.content
        return jsonify({"response": ai_response})
    except openai.error.AuthenticationError:
        # It's good practice to not expose parts of the key or too many details.
        return jsonify({"error": "OpenAI API key is invalid. Please check your configuration."}), 401
    except openai.error.OpenAIError as e:
        return jsonify({"error": f"OpenAI API error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    # To test the /chat endpoint (assuming API key is set as an environment variable):
    # 1. Make sure Flask server is running (python app.py)
    # 2. In a new terminal, run:
    #    curl -X POST -H "Content-Type: application/json" -d '{"message":"I have a headache and a slight fever"}' http://127.0.0.1:5000/chat
    #
    # You should receive a JSON response from the AI.
    #
    # To set the environment variable (Linux/macOS):
    # export OPENAI_API_KEY='your_actual_api_key_here'
    # To set the environment variable (Windows PowerShell):
    # $env:OPENAI_API_KEY='your_actual_api_key_here'
    # Remember to replace 'your_actual_api_key_here' with your actual key.
    # For persistent storage, add this line to your shell's profile file (e.g., .bashrc, .zshrc, or PowerShell profile).
    app.run(debug=True)
