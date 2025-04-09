/*
 * Generated type guards for "connection.svelte.ts".
 * WARNING: Do not manually change this file.
 */
import { EchoResult, LoginResult, UnlockKeySlotResult, KeyStolenMessage, UnauthorizedKeyPlaceAttemptedMessage, UnknownKeyPlacedMessage, UnrecognizedUserCardMessage, UserCardFoundButBlockedMessage } from "./connection.svelte";

export function isEchoResult(obj: unknown): obj is EchoResult {
    const typedObj = obj as EchoResult
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["id"] === "undefined" ||
            typeof typedObj["id"] === "string" ||
            typeof typedObj["id"] === "number") &&
        typedObj["type"] === "echo"
    )
}

export function isLoginResult(obj: unknown): obj is LoginResult {
    const typedObj = obj as LoginResult
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            (typeof typedObj["id"] === "undefined" ||
                typedObj["id"] === null ||
                typeof typedObj["id"] === "string" ||
                typeof typedObj["id"] === "number") &&
            typedObj["type"] === "login" &&
            typedObj["status"] === "success" &&
            typeof typedObj["jwt"] === "string" &&
            typeof typedObj["name"] === "string" &&
            Array.isArray(typedObj["keyData"]) &&
            typedObj["keyData"].every((e: any) =>
                (e !== null &&
                    typeof e === "object" ||
                    typeof e === "function") &&
                typeof e["slotId"] === "number" &&
                typeof e["slotName"] === "string" &&
                (typeof e["keyName"] === "undefined" ||
                    e["keyName"] === null ||
                    typeof e["keyName"] === "string") &&
                (typeof e["accessDenied"] === "undefined" ||
                    e["accessDenied"] === null ||
                    e["accessDenied"] === false ||
                    e["accessDenied"] === true)
            ) ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            (typeof typedObj["id"] === "undefined" ||
                typeof typedObj["id"] === "string" ||
                typeof typedObj["id"] === "number") &&
            typedObj["type"] === "login" &&
            typedObj["status"] === "failed" &&
            typeof typedObj["jwt"] === "undefined" ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            (typeof typedObj["id"] === "undefined" ||
                typeof typedObj["id"] === "string" ||
                typeof typedObj["id"] === "number") &&
            typedObj["type"] === "login" &&
            typedObj["status"] === "blocked" &&
            typeof typedObj["jwt"] === "undefined" &&
            typeof typedObj["currentUser"] === "string")
    )
}

export function isUnlockKeySlotResult(obj: unknown): obj is UnlockKeySlotResult {
    const typedObj = obj as UnlockKeySlotResult
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            (typeof typedObj["id"] === "undefined" ||
                typeof typedObj["id"] === "string" ||
                typeof typedObj["id"] === "number") &&
            typedObj["type"] === "unlock-key-slot" &&
            typedObj["status"] === "success" ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            (typeof typedObj["id"] === "undefined" ||
                typeof typedObj["id"] === "string" ||
                typeof typedObj["id"] === "number") &&
            typedObj["type"] === "unlock-key-slot" &&
            typedObj["status"] === "no-change" ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            (typeof typedObj["id"] === "undefined" ||
                typeof typedObj["id"] === "string" ||
                typeof typedObj["id"] === "number") &&
            typedObj["type"] === "unlock-key-slot" &&
            typedObj["status"] === "failed" &&
            (typeof typedObj["reason"] === "undefined" ||
                typeof typedObj["reason"] === "string"))
    )
}

export function isKeyStolenMessage(obj: unknown): obj is KeyStolenMessage {
    const typedObj = obj as KeyStolenMessage
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typedObj["type"] === "key-stolen" &&
        typeof typedObj["slotName"] === "string" &&
        typeof typedObj["keyName"] === "string" &&
        (typeof typedObj["deceptiveReplacement"] === "undefined" ||
            typedObj["deceptiveReplacement"] === null ||
            typeof typedObj["deceptiveReplacement"] === "string")
    )
}

export function isUnauthorizedKeyPlaceAttemptedMessage(obj: unknown): obj is UnauthorizedKeyPlaceAttemptedMessage {
    const typedObj = obj as UnauthorizedKeyPlaceAttemptedMessage
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typedObj["type"] === "unauth-key-place-attempt" &&
        typeof typedObj["slotName"] === "string" &&
        typeof typedObj["keyName"] === "string"
    )
}

export function isUnknownKeyPlacedMessage(obj: unknown): obj is UnknownKeyPlacedMessage {
    const typedObj = obj as UnknownKeyPlacedMessage
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typedObj["type"] === "unknown-key-placed" &&
        typeof typedObj["slotName"] === "string" &&
        typeof typedObj["keyId"] === "string"
    )
}

export function isUnrecognizedUserCardMessage(obj: unknown): obj is UnrecognizedUserCardMessage {
    const typedObj = obj as UnrecognizedUserCardMessage
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typedObj["type"] === "unrecognized-user-card" &&
        typeof typedObj["cardId"] === "string"
    )
}

export function isUserCardFoundButBlockedMessage(obj: unknown): obj is UserCardFoundButBlockedMessage {
    const typedObj = obj as UserCardFoundButBlockedMessage
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typedObj["type"] === "user-card-blocked" &&
        typeof typedObj["blockedUser"] === "string" &&
        typeof typedObj["currentUser"] === "string"
    )
}
