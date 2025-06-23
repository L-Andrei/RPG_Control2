from flask import Flask, request, jsonify
from sshtunnel import SSHTunnelForwarder
import pymysql
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

SSH_HOST = 'meu-servidor.com'
SSH_PORT = 22
SSH_USER = 'rpgadmin'
SSH_PKEY = './id_rsa'

DB_HOST = '127.0.0.1'
DB_USER = 'rpgdb_user'
DB_PASSWORD = 'senha_forte_aqui'
DB_NAME = 'rpg_manager'

def criar_tunel():
    server = SSHTunnelForwarder(
        (SSH_HOST, SSH_PORT),
        ssh_username=SSH_USER,
        ssh_pkey=SSH_PKEY,
        remote_bind_address=(DB_HOST, 3306)
    )
    server.start()
    return server

def criar_conexao(server):
    conn = pymysql.connect(
        host='127.0.0.1',
        port=server.local_bind_port,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )
    return conn

@app.route('/cadastro', methods=['POST'])
def cadastro():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400

    server = criar_tunel()
    conn = criar_conexao(server)

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT email FROM usuario WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({'error': 'Usuário já existe'}), 409

            hashed_senha = generate_password_hash(senha)
            cursor.execute("INSERT INTO usuario (email, senha) VALUES (%s, %s)", (email, hashed_senha))
        conn.commit()
        return jsonify({'message': 'Usuário criado com sucesso'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
        server.stop()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400

    server = criar_tunel()
    conn = criar_conexao(server)

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT senha FROM usuario WHERE email = %s", (email,))
            result = cursor.fetchone()
            if not result:
                return jsonify({'error': 'Usuário não encontrado'}), 404

            if not check_password_hash(result['senha'], senha):
                return jsonify({'error': 'Senha incorreta'}), 401

        return jsonify({'message': 'Login realizado com sucesso'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
        server.stop()

if __name__ == '__main__':
    app.run(debug=True,ssl_context=('cert.pem', 'key.pem'),host='0.0.0.0',port=8443)