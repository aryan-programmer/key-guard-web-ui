function* generator() {
	let i = 0;
	while (true) {
		yield (++i).toString(36) + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
	}
	return "";
}

const knowObjects = new WeakMap<object, string>();
const refsRec: Record<string, WeakRef<object>> = {};
const generate: Generator<string, string> = generator();

export function randomAddress() {
	return generate.next().value;
}

export const addresses: Readonly<Record<string, WeakRef<object>>> = refsRec;

export function getAddress(object: object) {
	let address: string;
	if (knowObjects.has(object)) {
		address = knowObjects.get(object)!;
	} else {
		address = generate.next().value;
		knowObjects.set(object, address);
		refsRec[address] = new WeakRef(object);
	}
	return address;
}
