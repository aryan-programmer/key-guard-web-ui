/*
 * Generated type guards for "connection.svelte.ts".
 * WARNING: Do not manually change this file.
 */
import { EchoResult, LoginResult, UnlockKeySlotResult } from "./connection.svelte";

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
                    typeof e["keyName"] === "string") &&
                (typeof e["accessDenied"] === "undefined" ||
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
            typeof typedObj["jwt"] === "undefined")
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
            typedObj["status"] === "failed" &&
            (typeof typedObj["reason"] === "undefined" ||
                typeof typedObj["reason"] === "string"))
    )
}
