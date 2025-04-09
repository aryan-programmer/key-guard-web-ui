import datetime
import json
import random
import threading
import time
import jwt
from websockets.sync.server import serve, ServerConnection

with open("./ws_hmac", "r") as r:
    secret = r.read()

main_conn: ServerConnection | None = None

key_data_1 = [
    {"slotId": 1, "slotName": "Key Slot 1"},
    {"slotId": 2, "slotName": "Key Slot 2", "keyName": "Key Alpha"},
    {
        "slotId": 3,
        "slotName": "Key Slot 2",
        "keyName": "Key Beta",
        "accessDenied": True,
    },
]

key_data_2 = [
    {"slotId": 1, "slotName": "Key Slot 1", "keyName": "Key Alpha"},
    {
        "slotId": 2,
        "slotName": "Key Slot 2",
        "keyName": "Key Beta",
        "accessDenied": True,
    },
]

last_jwt: str | None = None


def echo(websocket: ServerConnection):
    global main_conn
    global last_jwt
    if main_conn is not None and main_conn is not websocket:
        main_conn.close()
    main_conn = websocket
    for message in websocket:
        event = json.loads(message)
        print(message)
        match event:
            case {"type": "echo"}:
                websocket.send(message)
            case {
                "type": "login",
                "username": str(username),
                "password": str(password),
                "id": str(id),
            }:
                if username == "aryan" and password == "password":
                    encoded_jwt = jwt.encode(
                        {
                            "username": str(username),
                            "generatedAt": datetime.datetime.now().isoformat(),
                        },
                        secret,
                        algorithm="HS256",
                    )
                    last_jwt = encoded_jwt
                    websocket.send(
                        json.dumps(
                            {
                                "type": "login",
                                "id": id,
                                "status": "success",
                                "jwt": encoded_jwt,
                                "name": "Aryan Chudasama",
                                "keyData": key_data_1,
                            }
                        )
                    )
                else:
                    websocket.send(
                        json.dumps({"id": id, "type": "login", "status": "failed"})
                    )
            case {
                "type": "unlock-key-slot",
                "jwt": str(enc_jwt),
                "slotId": int(slot_id),
                "id": str(id),
            }:
                handle_unlock_key_slot_message(websocket, id, enc_jwt, slot_id)


def handle_unlock_key_slot_message(
    websocket: ServerConnection, id: str, enc_jwt: str, slot_id: int
):
    global last_jwt
    if last_jwt != enc_jwt:
        send_unlock_key_failed(websocket, id, "Authentication Token is outdated")
        return
    try:
        decoded_jwt = jwt.decode(enc_jwt, secret, algorithms=["HS256"])
        match decoded_jwt:
            case {
                "username": str(username),
                "generatedAt": str(generatedAt),
            }:
                maxT = datetime.datetime.fromisoformat(
                    generatedAt
                ) + datetime.timedelta(seconds=60)
                if datetime.datetime.now() < maxT:
                    if random.random() < 0.5:

                        def fn():
                            websocket.send(
                                json.dumps(
                                    {
                                        "type": "unlock-key-slot",
                                        "id": id,
                                        "status": "success",
                                    }
                                )
                            )

                        threading.Timer(2, fn).start()
                        return
                    else:
                        send_unlock_key_failed(websocket, id, "Access Denied")
                        return
                else:
                    send_unlock_key_failed(websocket, id, "Timed out")
                    return
            case _:
                send_unlock_key_failed(websocket, id, "Invalid JWT Format")
                return
        send_unlock_key_failed(websocket, id)
    except jwt.InvalidSignatureError:
        send_unlock_key_failed(websocket, id, "Invalid signature for JWT token")
        return
    finally:
        last_jwt = None


def send_unlock_key_failed(websocket: ServerConnection, id: str, reason: str | None):
    websocket.send(
        json.dumps(
            {
                "id": id,
                "type": "unlock-key-slot",
                "status": "failed",
                "reason": reason,
            }
        )
    )


def main():
    with serve(echo, "localhost", 2000) as server:
        server.serve_forever()


if __name__ == "__main__":
    threading.Thread(target=main, daemon=True).start()
    while True:
        res = input(">")
        if main_conn is not None:
            main_conn: ServerConnection
            if res == "":
                encoded_jwt = jwt.encode(
                    {
                        "username": "aryan",
                        "generatedAt": datetime.datetime.now().isoformat(),
                    },
                    secret,
                    algorithm="HS256",
                )
                last_jwt = encoded_jwt
                main_conn.send(
                    json.dumps(
                        {
                            "type": "login",
                            "status": "success",
                            "jwt": encoded_jwt,
                            "name": "Aryan Chudasama",
                            "keyData": key_data_2,
                        }
                    )
                )
            elif res == "s1":
                main_conn.send(
                    json.dumps(
                        {
                            "type": "key-stolen",
                            "slotName": "Key Slot 1",
                            "keyName": "Key Alpha",
                        }
                    )
                )
            elif res == "s2":
                main_conn.send(
                    json.dumps(
                        {
                            "type": "key-stolen",
                            "slotName": "Key Slot 2",
                            "keyName": "Key Beta",
                            "deceptiveReplacement": "Key Omega",
                        }
                    )
                )
            elif res == "u":
                main_conn.send(
                    json.dumps(
                        {
                            "type": "unauth-key-place-attempt",
                            "slotName": "Key Slot 2",
                            "keyName": "Key Beta",
                        }
                    )
                )
            elif res == "unk":
                main_conn.send(
                    json.dumps(
                        {
                            "type": "unknown-key-placed",
                            "slotName": "Key Slot 2",
                            "keyId": "2b7q0a",
                        }
                    )
                )
