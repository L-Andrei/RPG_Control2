from flask import Flask
from sshtunnel import SSHTunnelForwarder
import pymysql

app = Flask(__name__)

# Configurações do SSH
SSH_HOST = 'rpgmaster.com'           # IP ou domínio do servidor
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

if __name__ == '__main__':
    app.run(debug=True)

# Fecha o túnel ao encerrar o app
import atexit
atexit.register(server.stop)
