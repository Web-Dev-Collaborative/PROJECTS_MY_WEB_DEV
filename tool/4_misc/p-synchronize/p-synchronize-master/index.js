'use strict';

const pSynchronize = () => {
	let p = Promise.resolve();
	const wrap = fn => {
		return (...args) => {
			// eslint-disable-next-line promise/prefer-await-to-then
			const res = p.then(() => fn(...args), null);
			// Continue on to the next invocaction even after rejection
			p = res.catch(() => {});
			return res;
		};
	};

	return wrap;
};

module.exports = pSynchronize;
module.exports.default = pSynchronize;
