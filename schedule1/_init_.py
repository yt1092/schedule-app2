import os
from flask import Flask
from config import Config
from .db import init_db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    with app.app_context():
        init_db()

    from .routes import main
    app.register_blueprint(main)

    return app

app = create_app()