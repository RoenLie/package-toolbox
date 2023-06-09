export const isObject = (obj: any) => {
	return Object.prototype.toString.call(obj) === '[object Object]';
};

export const isPlainObject = (obj: any) => {
	let ctor, prot;

	if (isObject(obj) === false)
		return false;

	// If has modified constructor
	ctor = obj.constructor;
	if (ctor === undefined)
		return true;

	// If has modified prototype
	prot = ctor.prototype;
	if (isObject(prot) === false)
		return false;

	// If constructor does not have an Object-specific method
	if (prot.hasOwnProperty('isPrototypeOf') === false)
		return false;

	// Most likely a plain Object
	return true;
};
