from flask import Flask, redirect, render_template, send_from_directory, jsonify
from flask_session import Session
from flask_cors import CORS
from flask import session
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import datetime
# Registrar blueprints (rutas)
from routes.auth import auth_bp
from routes.competition import tournament_bp
from routes.groups import squad_bp
from routes.sports import sports_bp
from routes.roster import roster_bp
from pathlib import Path
# from back.routes.competition import tournament_bp

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend')
CORS(app)

# Configuración esencial
app.config.update(
    SECRET_KEY=os.getenv("SECRET_KEY", "dev-key-segura"),
    SESSION_TYPE='mongodb',
    SESSION_MONGODB=MongoClient(os.getenv("MONGO_URI")),
    SESSION_MONGODB_DB='sports_web',
    SESSION_MONGODB_COLLECT='sessions',
    SESSION_PERMANENT=True,
    PERMANENT_SESSION_LIFETIME=datetime.timedelta(hours=24),
    SESSION_USE_SIGNER=True,
    SESSION_COOKIE_SECURE=False,  # True en producción con HTTPS
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax'
)

# Inicializar extensiones
Session(app)
# Configuración MongoDB
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.sports_web

static_folder = Path(__file__).parent.parent / 'frontend'

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(tournament_bp, url_prefix='/api/tournaments')
app.register_blueprint(roster_bp, url_prefix='/api/roster')
app.register_blueprint(squad_bp, url_prefix='/api/groups')
app.register_blueprint(sports_bp, url_prefix='/api/sports')

@app.route('/')
def home():
    return render_template('index.html')#return send_from_directory(app.static_folder, 'index.html')

# Ruta para archivos estáticos (CSS, JS, imágenes)
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/administrador')
def admin_panel():
    if "superUser" in session:
        if session["superUser"] == False:
            return redirect('/')
    else:
        return redirect('/')

    return render_template('administrador.html')


@app.route('/edit/<torneo_id>')
def admin_edit_toutnament(torneo_id):
    if "superUser" in session:
        if session["superUser"] == False:
            return redirect('/')
    else:
        return redirect('/')

    return render_template('actualizaciontorneo.html')

@app.route('/config/<torneo_id>')
def admin_config(torneo_id):
    if "superUser" in session:
        print(session)
        if session["superUser"] == False:
            return redirect('/')
    else:
        return redirect('/')
    return render_template('configuration.html')

@app.route('/<tournament_id>/squad/<squad_id>/template/edit')
def squad_details(tournament_id, squad_id):
    if "superUser" in session:
        print(session)
        if session["superUser"] == False:
            return redirect('/')
    else:
        return redirect('/')
    return render_template('plantilla.html')


@app.route('/includes/<path:filename>')
def serve_include(filename):
    return send_from_directory(os.path.join(app.static_folder, 'includes'), filename)

if __name__ == '__main__':
    app.run(debug=True)