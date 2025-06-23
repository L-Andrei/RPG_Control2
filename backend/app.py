from flask import Flask, request, jsonify
from sshtunnel import SSHTunnelForwarder
import pymysql
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:8433"])

# Configurações do SSH
SSH_HOST = '0.0.0.0'           # IP ou domínio do servidor
SSH_PORT = 22
SSH_USER = 'rpgadmin'                # Usuário SSH no servidor
SSH_PKEY = 'id_rsa'  # Caminho da chave privada SSH

# Configurações do banco de dados MariaDB
DB_HOST = '127.0.0.1'                # O MariaDB no servidor escuta no localhost
DB_USER = 'rpgdb_user'               # Usuário do banco
DB_PASSWORD = 'senha_forte_aqui'      # Senha do banco
DB_NAME = 'rpg_manager'              # Nome do banco de dados

# Cria o túnel SSH
server = SSHTunnelForwarder(
    (SSH_HOST, SSH_PORT),
    ssh_username=SSH_USER,
    ssh_pkey=SSH_PKEY,
    remote_bind_address=(DB_HOST, 3306)
)

server.start()

# Conexão com MariaDB usando o túnel
conn = pymysql.connect(
    host='127.0.0.1',
    port=server.local_bind_port,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME
)

@app.route('/cadastro', methods=['POST'])
def cadastro():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400

    try:
        with conn.cursor() as cursor:
            # Verifica se o email já existe
            cursor.execute("SELECT email FROM usuario WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({'error': 'Usuário já existe'}), 409

            # Insere novo usuário
            cursor.execute("INSERT INTO usuario (email, senha) VALUES (%s, %s)", (email, senha))
        conn.commit()
        return jsonify({'message': 'Usuário criado com sucesso'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400

    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT senha FROM usuario WHERE email = %s", (email,))
            result = cursor.fetchone()
            if not result:
                return jsonify({'error': 'Usuário não encontrado'}), 404

            if result['senha'] != senha:
                return jsonify({'error': 'Senha incorreta'}), 401

        return jsonify({'message': 'Login realizado com sucesso'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)

# Fecha o túnel ao encerrar o app
import atexit
atexit.register(server.stop)
