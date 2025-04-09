import isBlob from "is-blob";
import WebSocketAsPromised from "websocket-as-promised";
import { addAlertoast } from "./alertoast.svelte";
import {
	isEchoResult,
	isKeyStolenMessage,
	isLoginResult,
	isUnauthorizedKeyPlaceAttemptedMessage,
	isUnknownKeyPlacedMessage,
	isUnlockKeySlotResult,
	isUnrecognizedUserCardMessage,
	isUserCardFoundButBlockedMessage
} from "./connection.svelte.guard";
import { ProgressBarState } from "./progress-bar.svelte";
import { addToast } from "./toaster.svelte";
import { isNonNullAndNonEmpty, logError } from "./utils";

export enum State {
	Forbidden = "forbidden",
	NotStarted = "not-started",
	Pending = "pending",
	Done = "done",
	Failed = "failed"
}
export type StateStrings = `${State}`;

export type EchoRequest = { type: "echo" };
/** @see {isEchoResult} ts-auto-guard:type-guard */
export type EchoResult = { id?: string | number; type: "echo" };

export type KeySlotData = {
	slotId: number;
	slotName: string;
	keyName?: string | null | undefined;
	accessDenied?: boolean | null | undefined;
};

export type LoginSuccessResult = {
	id?: string | number | null | undefined;
	type: "login";
	status: "success";
	jwt: string;
	name: string;
	keyData: KeySlotData[];
};

export type LoginRequest = { type: "login"; username: string; password: string };
/** @see {isLoginResult} ts-auto-guard:type-guard */
export type LoginResult =
	| LoginSuccessResult
	| { id?: string | number; type: "login"; status: "failed"; jwt: never }
	| { id?: string | number; type: "login"; status: "blocked"; jwt: never; currentUser: string };

export type UnlockKeySlotRequest = { type: "unlock-key-slot"; jwt: string; slotId: number };
/** @see {isUnlockKeySlotResult} ts-auto-guard:type-guard */
export type UnlockKeySlotResult =
	| { id?: string | number; type: "unlock-key-slot"; status: "success" }
	| { id?: string | number; type: "unlock-key-slot"; status: "no-change" }
	| { id?: string | number; type: "unlock-key-slot"; status: "failed"; reason?: string };

/** @see {isKeyStolenMessage} ts-auto-guard:type-guard */
export type KeyStolenMessage = {
	type: "key-stolen";
	slotName: string;
	keyName: string;
	deceptiveReplacement?: string | null | undefined;
};

/** @see {isUnauthorizedKeyPlaceAttemptedMessage} ts-auto-guard:type-guard */
export type UnauthorizedKeyPlaceAttemptedMessage = {
	type: "unauth-key-place-attempt";
	slotName: string;
	keyName: string;
};

/** @see {isUnknownKeyPlacedMessage} ts-auto-guard:type-guard */
export type UnknownKeyPlacedMessage = {
	type: "unknown-key-placed";
	slotName: string;
	keyId: string;
};

/** @see {isUnrecognizedUserCardMessage} ts-auto-guard:type-guard */
export type UnrecognizedUserCardMessage = {
	type: "unrecognized-user-card";
	cardId: string;
};

/** @see {isUserCardFoundButBlockedMessage} ts-auto-guard:type-guard */
export type UserCardFoundButBlockedMessage = {
	type: "user-card-blocked";
	blockedUser: string;
	currentUser: string;
};

export const keySlotSelectionMaxTimeMsActual = 60000;
export const keySlotPostSelectionPrepTimeMs = 3000;
export const keySlotSelectionMaxTimeMs =
	keySlotSelectionMaxTimeMsActual - keySlotPostSelectionPrepTimeMs - 2000;

export const SOLENOID_LOCK_WAIT_TIME_S = 2;
export const RELOCK_KEY_TIMEOUT_S = 5;

// type ConnectionEventTypes = {
// 	keySlotSelectionTimeout(): void;
// 	keySlotTransactionDone(): void;
// 	keySlotTransactionFailed(reason?: string): void;
// };

export class Connection {
	// #emitter = new EventEmitter<ConnectionEventTypes>();
	#websocket: WebSocketAsPromised | null = null;
	connectionState = $state(State.NotStarted);
	loginState = $state(State.Forbidden);
	loggedInDisplayName = $state(null as string | null);
	// loginFailureReason = $state(null as string | null);
	#loginJwt: string | null = null;
	keySlots = $state.raw([] as KeySlotData[]);
	keySlotSelectionRemainingTimeProgressBar = new ProgressBarState();
	keySlotPostSelectionBufferTimeProgressBar = new ProgressBarState();
	keySlotInsertTimeProgressBar = new ProgressBarState();
	keySlotSelectionState = $state(State.Forbidden);

	async connect(url: string) {
		this.#websocket?.close();
		try {
			this.connectionState = State.Pending;
			const ws = (this.#websocket = new WebSocketAsPromised(url, {
				connectionTimeout: 15000,
				packMessage: (data) => JSON.stringify(data, null, 0),
				unpackMessage: (data) => {
					if (typeof data === "string") {
						return isNonNullAndNonEmpty(data) ? JSON.parse(data) : null;
					} else if (isBlob(data)) {
						return data.text().then((v) => (isNonNullAndNonEmpty(v) ? JSON.parse(v) : null));
					}
					return Buffer.from(data).toJSON();
				},
				attachRequestId: (data, requestId) => Object.assign({ id: requestId }, data),
				extractRequestId: (data) => data?.id
			}));
			await ws.open();

			ws.onClose.addListener(() => {
				this.#websocket = null;
				this.connectionState = State.NotStarted;
				this.loginState = State.Forbidden;
				this.loggedInDisplayName = null;
				// this.loginFailureReason = null;
				this.#loginJwt = null;
				this.keySlots = [];
				this.keySlotSelectionRemainingTimeProgressBar.reset();
				this.keySlotSelectionState = State.Forbidden;
				addToast({
					data: {
						title: "Connection to WebSocket Server Closed",
						variant: "error"
					}
				});
			});
			ws.onMessage.addListener((v) => {
				const res = typeof v === "object" ? v : isNonNullAndNonEmpty(v) ? JSON.parse(v) : null;
				// console.log("ws.onMessage: ", res, isLoginResult(res));
				if (isLoginResult(res) && res.status === "success" && res["id"] == null) {
					this.onSuccessLoginResult(res);
				} else if (isKeyStolenMessage(res)) {
					addAlertoast({
						data: {
							title: `${res.keyName} stolen from ${res.slotName}`,
							description:
								res.deceptiveReplacement == null
									? undefined
									: `User also attemped to deceivingly replace it with key ${res.deceptiveReplacement}`,
							variant: "error"
						}
					});
				} else if (isUnauthorizedKeyPlaceAttemptedMessage(res)) {
					addAlertoast({
						data: {
							title: "Unauthorized key place attempted",
							description: `An unknown user attemped to place ${res.keyName} at ${res.slotName} without authenticating themselves.`,
							variant: "error"
						}
					});
				} else if (isUnknownKeyPlacedMessage(res)) {
					addAlertoast({
						data: {
							title: "Unknown key placed",
							description: `An user attemped to place an unidentified key with RFID tag ${res.keyId} at ${res.slotName}.`,
							variant: "error"
						}
					});
				} else if (isUnrecognizedUserCardMessage(res)) {
					addAlertoast({
						data: {
							title: "Unknown user card placed",
							description: `An unrecognized user card was shown with RFID tag ${res.cardId}.`,
							variant: "error"
						}
					});
				} else if (isUserCardFoundButBlockedMessage(res)) {
					addToast({
						data: {
							title: `User card for ${res.blockedUser} found but blocked`,
							description: `Because user ${res.currentUser} is already logged in.`,
							variant: "warning"
						}
					});
				}
			});

			const echoSent: EchoRequest = { type: "echo" };
			const echoRes = await ws.sendRequest(echoSent);
			if (isEchoResult(echoRes)) {
				this.#websocket = ws;
				this.connectionState = State.Done;
				this.loginState = State.NotStarted;
				this.keySlotSelectionState = State.Forbidden;
			} else {
				console.error(
					"Failed to connect: Echo test package fails to return properly:\nSent: ",
					echoSent,
					"\nReceied: ",
					echoRes
				);
				this.connectionState = State.Failed;
			}
		} catch (ex) {
			logError("Failed to connect:", ex);
			this.connectionState = State.Failed;
		}
	}

	async login(username: string, password: string) {
		const ws = this.#websocket;
		if (ws == null || this.loginState === State.Forbidden) {
			return;
		}
		try {
			// this.loginFailureReason = "";
			this.loginState = State.Pending;
			const req: LoginRequest = { type: "login", username, password };
			const res = await ws.sendRequest(req);
			if (isLoginResult(res)) {
				if (res.status === "success") {
					this.onSuccessLoginResult(res);
				} else if (res.status === "blocked") {
					addToast({
						data: {
							title: "Login failed",
							description: `Blocked by server as ${res.currentUser} is already logged in.`,
							variant: "warning"
						}
					});
					// this.loginFailureReason = "Blocked by Server";
					this.loginState = State.Failed;
				} else {
					addToast({
						data: {
							title: "Login failed",
							description: "Invalid Username or Password",
							variant: "error"
						}
					});
					// this.loginFailureReason = "Invalid Username or Password";
					this.loginState = State.Failed;
				}
			} else {
				addToast({
					data: {
						title: "Login failed",
						description: "Server error: Invalid response",
						variant: "error"
					}
				});
				// this.loginFailureReason = "Server error";
				console.error("Failed to login: Invalid response: ", res);
				this.loginState = State.Failed;
			}
		} catch (ex) {
			addToast({
				data: {
					title: "Login failed",
					description: "Unknown error",
					variant: "error"
				}
			});
			// this.loginFailureReason = "Unknown error";
			logError("Failed to login:", ex);
			this.loginState = State.Failed;
		}
	}

	async unlockKeySlot(keySlot: KeySlotData) {
		const ws = this.#websocket;
		if (
			ws == null ||
			this.loginState !== State.Done ||
			this.keySlotSelectionState === State.Forbidden
		) {
			return;
		}
		this.keySlotSelectionState = State.Pending;
		this.keySlotSelectionRemainingTimeProgressBar.cancel();
		await this.keySlotPostSelectionBufferTimeProgressBar.countUp(keySlotPostSelectionPrepTimeMs);
		try {
			const req: UnlockKeySlotRequest = {
				type: "unlock-key-slot",
				jwt: this.#loginJwt!,
				slotId: keySlot.slotId
			};
			this.keySlotInsertTimeProgressBar.countUp(RELOCK_KEY_TIMEOUT_S * 1000);
			const res = await ws.sendRequest(req);
			this.keySlotInsertTimeProgressBar.cancel();
			this.loginState = State.NotStarted;
			this.keySlotSelectionState = State.Forbidden;
			if (isUnlockKeySlotResult(res)) {
				if (res.status === "success") {
					addToast({
						data: {
							title: "Key slot transaction successfully completed",
							description: "To perform another tranaction please login again.",
							variant: "success"
						}
					});
					// this.#emitter.emit("keySlotTransactionDone");
				} else if (res.status === "no-change") {
					addToast({
						data: {
							title: "Key slot transaction timed out with no change.",
							description: "To perform another tranaction please login again.",
							variant: "info"
						}
					});
				} else {
					this.onKeySlotSelectionFailure(res.reason);
				}
			} else {
				console.error("Failed to unlock key slot: Invalid response: ", res);
				this.onKeySlotSelectionFailure("Invalid server response");
			}
		} catch (ex) {
			this.keySlotInsertTimeProgressBar.cancel();
			this.loginState = State.NotStarted;
			this.keySlotSelectionState = State.Forbidden;
			logError("Failed to unlock key slot:", ex);
			this.onKeySlotSelectionFailure("Unknown error");
		}
	}

	private onKeySlotSelectionFailure(reason?: string) {
		this.#loginJwt = null;
		this.loggedInDisplayName = null;
		this.keySlots = [];
		this.loginState = this.connectionState === State.Done ? State.NotStarted : State.Forbidden;
		this.keySlotSelectionState = State.Forbidden;
		addToast({
			data: {
				title: "Key slot transaction failed",
				description: reason ?? "Unknown error",
				variant: "error"
			}
		});
		// this.#emitter.emit("keySlotTransactionFailed", reason);
	}

	private onSuccessLoginResult(res: LoginSuccessResult) {
		this.#loginJwt = res.jwt;
		this.loggedInDisplayName = res.name;
		this.keySlots = res.keyData;
		this.loginState = State.Done;
		this.keySlotSelectionState = State.NotStarted;

		this.keySlotSelectionRemainingTimeProgressBar
			.countUp(keySlotSelectionMaxTimeMs)
			.then((completed) => {
				if (completed) {
					this.#loginJwt = null;
					this.loggedInDisplayName = null;
					this.keySlots = [];
					this.loginState =
						this.connectionState === State.Done ? State.NotStarted : State.Forbidden;
					this.keySlotSelectionState = State.Forbidden;
					addToast({
						data: {
							title: "Key slot selection timed out",
							description: "You waited for too long. Please login again.",
							variant: "warning"
						}
					});
					// this.#emitter.emit("keySlotSelectionTimeout");
				}
			});
	}

	// on<T extends EventEmitter.EventNames<ConnectionEventTypes>>(
	// 	event: T,
	// 	fn: EventEmitter.EventListener<ConnectionEventTypes, T>
	// ) {
	// 	this.#emitter.on(event, fn);
	// }

	// once<T extends EventEmitter.EventNames<ConnectionEventTypes>>(
	// 	event: T,
	// 	fn: EventEmitter.EventListener<ConnectionEventTypes, T>
	// ) {
	// 	this.#emitter.once(event, fn);
	// }

	// off<T extends EventEmitter.EventNames<ConnectionEventTypes>>(
	// 	event: T,
	// 	fn?: EventEmitter.EventListener<ConnectionEventTypes, T>,
	// 	once?: boolean
	// ) {
	// 	this.#emitter.off(event, fn, once);
	// }
}
