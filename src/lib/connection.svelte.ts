import EventEmitter from "eventemitter3";
import isBlob from "is-blob";
import WebSocketAsPromised from "websocket-as-promised";
import { isEchoResult, isLoginResult, isUnlockKeySlotResult } from "./connection.svelte.guard";
import { ProgressBar } from "./progressBar.svelte";
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
	keyName?: string;
	accessDenied?: boolean;
};

export type LoginSuccessResult = {
	id?: string | number;
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
	| { id?: string | number; type: "login"; status: "failed"; jwt: never };

export type UnlockKeySlotRequest = { type: "unlock-key-slot"; jwt: string; slotId: number };
/** @see {isUnlockKeySlotResult} ts-auto-guard:type-guard */
export type UnlockKeySlotResult =
	| { id?: string | number; type: "unlock-key-slot"; status: "success" }
	| { id?: string | number; type: "unlock-key-slot"; status: "failed"; reason?: string };

export const keySlotSelectionMaxTimeMs = 60000;

type ConnectionEventTypes = {
	keySlotSelectionTimeout(): void;
	keySlotTransactionDone(): void;
	keySlotTransactionFailed(reason?: string): void;
};

export class Connection {
	#emitter = new EventEmitter<ConnectionEventTypes>();
	#websocket: WebSocketAsPromised | null = null;
	connectionState = $state(State.NotStarted);
	loginState = $state(State.Forbidden);
	loggedInDisplayName = $state(null as string | null);
	loginFailureReason = $state(null as string | null);
	#loginJwt: string | null = null;
	keySlots = $state.raw([] as KeySlotData[]);
	keySlotSelectionRemainingTimeProgressBar = new ProgressBar();
	keySlotSelectionState = $state(State.Forbidden);

	async connect(url: string) {
		this.#websocket?.close();
		try {
			this.connectionState = State.Pending;
			const ws = (this.#websocket = new WebSocketAsPromised(url, {
				connectionTimeout: 3,
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
			ws.onClose.addListener(() => {
				this.#websocket = null;
				this.connectionState = State.NotStarted;
				this.loginState = State.Forbidden;
				this.loggedInDisplayName = null;
				this.loginFailureReason = null;
				this.#loginJwt = null;
				this.keySlots = [];
				this.keySlotSelectionRemainingTimeProgressBar.reset();
				this.keySlotSelectionState = State.Forbidden;
			});
			ws.onMessage.addListener((v) => {
				const res = typeof v === "object" ? v : isNonNullAndNonEmpty(v) ? JSON.parse(v) : null;
				console.log("ws.onMessage: ", res);
				if (isLoginResult(res) && res.status === "success" && !("id" in res)) {
					this.onSuccessLoginResult(res);
				}
			});
			await ws.open();
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
			this.loginFailureReason = "";
			this.loginState = State.Pending;
			const req: LoginRequest = { type: "login", username, password };
			const res = await ws.sendRequest(req);
			if (isLoginResult(res)) {
				if (res.status === "success") {
					this.onSuccessLoginResult(res);
				} else {
					this.loginFailureReason = "Invalid Username or Password";
					this.loginState = State.Failed;
				}
			} else {
				this.loginFailureReason = "Server error";
				console.error("Failed to login: Invalid response: ", res);
				this.loginState = State.Failed;
			}
		} catch (ex) {
			this.loginFailureReason = "Unknown error";
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
		try {
			this.keySlotSelectionState = State.Pending;
			const req: UnlockKeySlotRequest = {
				type: "unlock-key-slot",
				jwt: this.#loginJwt!,
				slotId: keySlot.slotId
			};
			const res = await ws.sendRequest(req);
			if (isUnlockKeySlotResult(res)) {
				if (res.status === "success") {
					this.keySlotSelectionRemainingTimeProgressBar.cancel();
					this.loginState = State.NotStarted;
					this.keySlotSelectionState = State.Forbidden;
					this.#emitter.emit("keySlotTransactionDone");
				} else {
					this.onKeySlotSelectionFailure(res.reason);
				}
			} else {
				console.error("Failed to unlock key slot: Invalid response: ", res);
				this.onKeySlotSelectionFailure("Invalid server response");
			}
		} catch (ex) {
			logError("Failed to unlock key slot:", ex);
			this.onKeySlotSelectionFailure("Unknown error");
		}
	}

	private onKeySlotSelectionFailure(reason?: string) {
		this.keySlotSelectionRemainingTimeProgressBar.cancel();
		this.#loginJwt = null;
		this.loggedInDisplayName = null;
		this.keySlots = [];
		this.loginState = this.connectionState === State.Done ? State.NotStarted : State.Forbidden;
		this.keySlotSelectionState = State.Forbidden;
		this.#emitter.emit("keySlotTransactionFailed", reason);
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
					this.#emitter.emit("keySlotSelectionTimeout");
				}
			});
	}

	on<T extends EventEmitter.EventNames<ConnectionEventTypes>>(
		event: T,
		fn: EventEmitter.EventListener<ConnectionEventTypes, T>
	) {
		this.#emitter.on(event, fn);
	}

	once<T extends EventEmitter.EventNames<ConnectionEventTypes>>(
		event: T,
		fn: EventEmitter.EventListener<ConnectionEventTypes, T>
	) {
		this.#emitter.once(event, fn);
	}

	off<T extends EventEmitter.EventNames<ConnectionEventTypes>>(
		event: T,
		fn?: EventEmitter.EventListener<ConnectionEventTypes, T>,
		once?: boolean
	) {
		this.#emitter.off(event, fn, once);
	}
}
