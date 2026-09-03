from dataclasses import dataclass
from mysql.connector.cursor import MySQLCursor
import mysql.connector
import init
import os
from dotenv import load_dotenv
load_dotenv()

db_host = os.environ["DB_HOST"]
db_user = os.environ["DB_USER"]
db_password = os.environ["DB_PASSWORD"]
db_name = os.environ["DB_NAME"]


COLS = ['NAME', 'EMAIL', 'PASSWORD']
COLS_CONV = ['TITLE', 'USER_ID']
COLS_MSG = ['ROLE', 'CONVERSATION_ID', 'CONTENT', 'IND']

@dataclass
class UserData:
    username:str
    password:str
    email:str

@dataclass
class UserConv:
    title:str
    user_id:int

class Connection:
    def __init__(self, host=db_host, user=db_user, password=db_password, database=db_name):
        self.config = {
            "host": host,
            "user": user,
            "password": password,
            "database": database
        }
        self.mydb: mysql.connector.connection.MySQLConnection = None
        self.cursor: mysql.connector.cursor.MySQLCursor = None
        self.user_id = None

    def connect(self):
        self.mydb = mysql.connector.connect(**self.config)
        self.cursor = self.mydb.cursor()

    def commit(self):
        self.mydb.commit()

    def login(self, email:str, password:str, table_name = "DATA"):
        query = f"SELECT *  FROM {table_name} WHERE EMAIL = %s"
        self.cursor.execute(query, (email, ))
        info = self.cursor.fetchone()
        if info is None:
            return "Database"
        else:
            pas, id = info[2], info[3]
            if pas == password:
                return id
            else:
                return "Pass"

    def send_info(self, table_name:str, user_info:dict):
        data = UserData(username=user_info['username'], password=user_info['password'], email=user_info['email'])
        columns = ", ".join(COLS)
        placeholders = ", ".join(["%s"] * len(COLS))

        insert_query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"

        self.cursor.execute(insert_query, (data.username, data.email, data.password))
        self.commit()


        return self.cursor.lastrowid

    def fetch_chat(self, user_id:int, table_conv:str = "CONVERSATIONS"):
        query = f"SELECT * FROM {table_conv} WHERE USER_ID = %s ORDER BY ID DESC"
        self.cursor.execute(query, (user_id, ))
        data = self.cursor.fetchall()
        return data

    def _conv_owner(self, conv_id:int, table_conv:str = "CONVERSATIONS"):
        """Returns the USER_ID owning the conversation, or None if it doesn't exist."""
        self.cursor.execute(f"SELECT USER_ID FROM {table_conv} WHERE ID = %s", (conv_id,))
        row = self.cursor.fetchone()
        return row[0] if row else None

    def fetch_chat_message(self, conv_id:int, user_id:int, table_message = "MESSAGES"):
        owner = self._conv_owner(conv_id)
        if owner is None:
            return f"Conversation {conv_id} does not exist"
        if int(owner) != int(user_id):
            return "Access denied"
        query = f"SELECT * FROM {table_message} WHERE CONVERSATION_ID = %s ORDER BY IND"
        self.cursor.execute(query, (conv_id, ))
        data = self.cursor.fetchall()
        return data

    def create_chat(self, user_id:int, title:str, table_conv:str = "CONVERSATIONS"):
        data = UserConv(user_id= user_id, title=title)
        columns = ", ".join(COLS_CONV)
        placeholder = ", ".join(["%s"] * len(COLS_CONV))
        insert_query = f"INSERT INTO {table_conv} ({columns}) VALUES ({placeholder})"
        self.cursor.execute(insert_query, (data.title, data.user_id))
        self.commit()

    def save_chat(self, chats: list[init.ChatMessage], conv_id: int, user_id: int, table_msg: str = "MESSAGES"):
        owner = self._conv_owner(conv_id)
        if owner is None:
            return f"Conversation {conv_id} does not exist"
        if int(owner) != int(user_id):
            return "Access denied"
        columns = ", ".join(COLS_MSG)
        placeholder = ", ".join(["%s"] * len(COLS_MSG))
        query = f"DELETE FROM {table_msg} WHERE CONVERSATION_ID = %s"
        self.cursor.execute(query, (conv_id,))
        self.commit()
        for con in chats:
            query = f"INSERT INTO {table_msg} ({columns}) VALUES ({placeholder})"
            self.cursor.execute(query, (con.ROLE, int(con.CONVERSATION_ID), con.CONTENT, con.IND))
            self.commit()

    def save_conv(self, conv_info:init.Conv, table_conv:str = "CONVERSATIONS"):
        columns = ", ".join(COLS_CONV)
        placeholder = ", ".join(["%s"] * len(COLS_CONV))
        query = f"INSERT INTO {table_conv} ({columns}) VALUES ({placeholder})"
        self.cursor.execute(query, (conv_info.title, conv_info.user_id))
        self.commit()
        return {"conv_id": self.cursor.lastrowid}

    def close(self):
        if self.cursor:
            self.cursor.close()
        if self.mydb and self.mydb.is_connected():
            self.mydb.close()








