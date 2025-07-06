from flask import Flask, request, jsonify
import pymysql
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from sshtunnel import SSHTunnelForwarder

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

DB_HOST = '127.0.0.1'          # O túnel entrega localmente
DB_PORT = 3306                # Porta local usada no túnel
DB_USER = 'rpgadmin'
DB_PASSWORD = 'parrot'
DB_NAME = 'rpg_manager'

SSH_HOST = '164.152.36.34'     # IP do servidor que aceita SSH
SSH_PORT = 22
SSH_USER = 'ubuntu'
SSH_PKEY = 'ssh.key'  # Caminho da chave privada no backend

def criar_conexao():
    # Cria o túnel SSH
    server = SSHTunnelForwarder(
        (SSH_HOST, SSH_PORT),
        ssh_username=SSH_USER,
        ssh_pkey=SSH_PKEY,
        remote_bind_address=(DB_HOST, DB_PORT)
    )
    server.start()

    # Conecta no banco via porta local do túnel
    conn = pymysql.connect(
        host='127.0.0.1',
        port=server.local_bind_port,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )
    
    # Para garantir que o túnel não feche, você pode adicionar a referência do server no objeto de conexão
    conn.ssh_tunnel = server
    return conn


"""
curl -k -X POST https://137.131.168.114:8443/cadastro \
-H "Content-Type: application/json" \
-d '{"email": "usuario@example.com", "senha": "minhasenha123"}'
"""

@app.route('/cadastro', methods=['POST'])
def cadastro():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400

    conn = criar_conexao()
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
        conn.ssh_tunnel.stop()

"""
curl -k -X POST https://137.131.168.114:8443/login \
-H "Content-Type: application/json" \
-d '{"email": "usuario@example.com", "senha": "minhasenha123"}'
"""

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({'error': 'Email e senha são obrigatórios'}), 400

    conn = criar_conexao()
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
        conn.ssh_tunnel.stop()

"""
curl -k -X POST https://137.131.168.114:8443/criar_mesa \
-H "Content-Type: application/json" \
-d '{"nome": "Mesa dos Aventureiros", "descricao": "Aventura no mundo de Eldoria", "criador_email": "usuario@example.com"}'
"""

@app.route('/criar_mesa', methods=['POST'])
def criar_mesa():
    data = request.get_json()
    nome = data.get('nome')
    descricao = data.get('descricao', '')
    criador_email = data.get('criador_email')

    if not nome or not criador_email:
        return jsonify({'error': 'Nome da mesa e e-mail do criador são obrigatórios'}), 400

    conn = criar_conexao()
    try:
        with conn.cursor() as cursor:
            # Verifica se já existe uma mesa criada por esse usuário
            cursor.execute("SELECT id_mesa FROM mesa WHERE criador_email = %s", (criador_email,))
            if cursor.fetchone():
                return jsonify({'error': 'Usuário já possui uma mesa'}), 409

            # Cria a nova mesa
            cursor.execute("""
                INSERT INTO mesa (nome, descricao, criador_email)
                VALUES (%s, %s, %s)
            """, (nome, descricao, criador_email))
            conn.commit()

            mesa_id = cursor.lastrowid

        return jsonify({
            'message': 'Mesa criada com sucesso',
            'id_mesa': mesa_id
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
        conn.ssh_tunnel.stop()
"""
curl -k -X POST https://137.131.168.114:8443/obter_mesa \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@example.com"}'
"""
@app.route('/obter_mesa', methods=['POST'])
def obter_mesa():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'E-mail é obrigatório'}), 400

    conn = criar_conexao()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id_mesa, nome, descricao
                FROM mesa
                WHERE criador_email = %s
            """, (email,))
            mesas = cursor.fetchall()

            if not mesas:
                return jsonify({'message': 'Nenhuma mesa encontrada para este e-mail'}), 404

        return jsonify(mesas), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()
        conn.ssh_tunnel.stop()


"""
curl -k -X POST https://137.131.168.114:8443/personagem \
-H "Content-Type: application/json" \
-d '{
    "nome": "Arthas",
    "classe": "Paladino",
    "usuario_email": "usuario@example.com",
    "id_mesa": 2
}'
"""

@app.route('/personagem', methods=['POST'])
def criar_personagem():
    data = request.get_json()
    nome = data.get('nome')
    classe = data.get('classe')
    usuario_email = data.get('usuario_email')
    id_mesa = data.get('id_mesa')

    if not nome or not usuario_email or not id_mesa:
        return jsonify({'error': 'Nome, email do usuário e ID da mesa são obrigatórios'}), 400

    conn = criar_conexao()
    try:
        with conn.cursor() as cursor:
            # Verifica se o usuário participa da mesa
            cursor.execute("""
                SELECT 1 FROM participante_mesa
                WHERE usuario_email = %s AND id_mesa = %s
            """, (usuario_email, id_mesa))
            if not cursor.fetchone():
                return jsonify({'error': 'Usuário não participa desta mesa'}), 403

            # Verifica se o usuário já tem personagem na mesa
            cursor.execute("""
                SELECT 1 FROM personagem
                WHERE usuario_email = %s AND id_mesa = %s
            """, (usuario_email, id_mesa))
            if cursor.fetchone():
                return jsonify({'error': 'Usuário já possui um personagem nesta mesa'}), 409

            # Cria o personagem
            cursor.execute("""
                INSERT INTO personagem (nome, classe, usuario_email, id_mesa)
                VALUES (%s, %s, %s, %s)
            """, (nome, classe, usuario_email, id_mesa))

        conn.commit()
        return jsonify({'message': 'Personagem criado com sucesso'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
        conn.ssh_tunnel.stop()


"""
curl -k https://137.131.168.114:8443/mesa/2
"""

@app.route('/mesa/<int:id_mesa>', methods=['GET'])
def consultar_mesa(id_mesa):
    conn = criar_conexao()
    try:
        with conn.cursor() as cursor:
            # Verifica se a mesa existe
            cursor.execute("SELECT id_mesa FROM mesa WHERE id_mesa = %s", (id_mesa,))
            if not cursor.fetchone():
                return jsonify({'error': 'Mesa não existe'}), 404

            # Consulta os personagens da mesa
            cursor.execute("""
                SELECT id_personagem, nome, classe, nivel, usuario_email
                FROM personagem
                WHERE id_mesa = %s
            """, (id_mesa,))
            
            personagens = cursor.fetchall()

        return jsonify({
            'id_mesa': id_mesa,
            'personagens': personagens
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
        conn.ssh_tunnel.stop()

"""
curl -k https://137.131.168.114:8443/personagem/2/usuario@example.com
"""

@app.route('/personagem/<int:id_mesa>/<email>', methods=['GET'])
def consultar_personagem(id_mesa, email):
    conn = criar_conexao()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id_personagem, nome, classe, nivel, usuario_email, id_mesa
                FROM personagem
                WHERE id_mesa = %s AND usuario_email = %s
            """, (id_mesa, email))
            
            personagem = cursor.fetchone()

            if not personagem:
                return jsonify({'error': 'Personagem não encontrado para este usuário na mesa especificada'}), 404

        return jsonify({'personagem': personagem}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
        conn.ssh_tunnel.stop()


"""
curl -k -X POST https://137.131.168.114:8443/participante \
-H "Content-Type: application/json" \
-d '{"usuario_email": "usuario@example.com", "id_mesa": 2}'
"""

@app.route('/participante', methods=['POST'])
def adicionar_participante():
    data = request.get_json()
    usuario_email = data.get('usuario_email')
    id_mesa = data.get('id_mesa')

    if not usuario_email or not id_mesa:
        return jsonify({'error': 'Email do usuário e ID da mesa são obrigatórios'}), 400

    conn = criar_conexao()
    try:
        with conn.cursor() as cursor:
            # Verifica se o usuário já é participante da mesa
            cursor.execute("""
                SELECT 1 FROM participante_mesa
                WHERE usuario_email = %s AND id_mesa = %s
            """, (usuario_email, id_mesa))
            if cursor.fetchone():
                return jsonify({'error': 'Usuário já é participante desta mesa'}), 409

            # Insere participante
            cursor.execute("""
                INSERT INTO participante_mesa (usuario_email, id_mesa)
                VALUES (%s, %s)
            """, (usuario_email, id_mesa))

        conn.commit()
        return jsonify({'message': 'Participante adicionado com sucesso'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
        conn.ssh_tunnel.stop()

"""
curl -k -X PUT https://137.131.168.114:8443/usuario/update \
-H "Content-Type: application/json" \
-d '{"email": "usuario@example.com", "senha": "novaSenha123"}'
"""
@app.route('/usuario/update', methods=['PUT'])
def atualizar_usuario():
    data = request.get_json()
    email = data.get('email')  # Email usado para identificar o usuário
    nova_senha = data.get('senha')  # Senha nova (opcional)

    if not email:
        return jsonify({'error': 'Email é obrigatório'}), 400

    if not nova_senha:
        return jsonify({'error': 'Senha nova é obrigatória'}), 400

    conn = criar_conexao()
    try:
        with conn.cursor() as cursor:
            # Verifica se usuário existe
            cursor.execute("SELECT email FROM usuario WHERE email = %s", (email,))
            if not cursor.fetchone():
                return jsonify({'error': 'Usuário não encontrado'}), 404

            # Atualiza senha com hash
            hashed_senha = generate_password_hash(nova_senha)
            cursor.execute("""
                UPDATE usuario SET senha = %s WHERE email = %s
            """, (hashed_senha, email))

        conn.commit()
        return jsonify({'message': 'Usuário atualizado com sucesso'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
        conn.ssh_tunnel.stop()

"""
curl -k -X PUT https://137.131.168.114:8443/personagem/update \
-H "Content-Type: application/json" \
-d '{"email": "usuario@example.com", "id_mesa": 2, "nome": "NovoNome", "nivel": 5}'
"""
@app.route('/personagem/update', methods=['PUT'])
def atualizar_personagem():
    data = request.get_json()
    email = data.get('email')
    id_mesa = data.get('id_mesa')
    nome = data.get('nome')
    classe = data.get('classe')
    nivel = data.get('nivel')

    if not email or not id_mesa:
        return jsonify({'error': 'Email e id_mesa são obrigatórios'}), 400

    if not nome and not classe and not nivel:
        return jsonify({'error': 'Nenhum dado para atualizar'}), 400

    conn = criar_conexao()
    try:
        with conn.cursor() as cursor:
            # Verifica se personagem existe
            cursor.execute("""
                SELECT id_personagem FROM personagem
                WHERE usuario_email = %s AND id_mesa = %s
            """, (email, id_mesa))
            personagem = cursor.fetchone()

            if not personagem:
                return jsonify({'error': 'Personagem não encontrado'}), 404

            # Monta dinamicamente a query de update
            updates = []
            values = []

            if nome:
                updates.append("nome = %s")
                values.append(nome)
            if classe:
                updates.append("classe = %s")
                values.append(classe)
            if nivel:
                updates.append("nivel = %s")
                values.append(nivel)

            values.extend([email, id_mesa])

            query = f"""
                UPDATE personagem
                SET {', '.join(updates)}
                WHERE usuario_email = %s AND id_mesa = %s
            """

            cursor.execute(query, values)
        conn.commit()
        return jsonify({'message': 'Personagem atualizado com sucesso'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
        conn.ssh_tunnel.stop()

"""
curl -k -X DELETE https://137.131.168.114:8443/expulsar \
-H "Content-Type: application/json" \
-d '{"nome": "NovoNome"}'
"""

@app.route('/expulsar', methods=['DELETE'])
def expulsar_jogador():
    data = request.get_json()
    nome_personagem = data.get('nome')

    if not nome_personagem:
        return jsonify({'error': 'Nome do personagem é obrigatório'}), 400

    conn = criar_conexao()
    try:
        with conn.cursor() as cursor:
            # Busca usuário_email e id_mesa pelo nome do personagem
            cursor.execute("""
                SELECT usuario_email, id_mesa FROM personagem WHERE nome = %s
            """, (nome_personagem,))
            resultado = cursor.fetchone()

            if not resultado:
                return jsonify({'error': 'Personagem não encontrado'}), 404

            usuario_email = resultado['usuario_email']
            id_mesa = resultado['id_mesa']

            # Remove personagem da tabela personagem
            cursor.execute("""
                DELETE FROM personagem WHERE nome = %s
            """, (nome_personagem,))

            # Remove participante da tabela participante_mesa
            cursor.execute("""
                DELETE FROM participante_mesa WHERE usuario_email = %s AND id_mesa = %s
            """, (usuario_email, id_mesa))

        conn.commit()
        return jsonify({'message': f'Jogador com personagem "{nome_personagem}" expulso com sucesso.'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()
        conn.ssh_tunnel.stop()


"""
curl -k -X DELETE https://137.131.168.114:8443/mesa/del/2
"""
@app.route('/mesa/del/<int:id_mesa>', methods=['DELETE'])
def deletar_mesa(id_mesa):
    conn = criar_conexao()
    try:
        with conn.cursor() as cursor:
            # 1) Buscar personagens da mesa
            cursor.execute("""
                SELECT id_personagem, nome, classe, nivel, usuario_email
                FROM personagem
                WHERE id_mesa = %s
            """, (id_mesa,))
            personagens = cursor.fetchall()

            # 2) Buscar participantes da mesa
            cursor.execute("""
                SELECT usuario_email
                FROM participante_mesa
                WHERE id_mesa = %s
            """, (id_mesa,))
            participantes = [row['usuario_email'] for row in cursor.fetchall()]

            # 3) Deletar personagens
            cursor.execute("DELETE FROM personagem WHERE id_mesa = %s", (id_mesa,))

            # 4) Deletar participantes
            cursor.execute("DELETE FROM participante_mesa WHERE id_mesa = %s", (id_mesa,))

            # 5) Deletar a mesa
            cursor.execute("DELETE FROM mesa WHERE id_mesa = %s", (id_mesa,))

        conn.commit()

        return jsonify({
            'message': 'Mesa removida com sucesso',
            'deleted_mesa_id': id_mesa,
            'deleted_personagens': personagens,
            'deleted_participantes': participantes
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        conn.close()
        conn.ssh_tunnel.stop()

if __name__ == '__main__':
    app.run(debug=True, ssl_context=('cert.pem', 'key.pem'), host='0.0.0.0', port=8443)
