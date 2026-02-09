/**
 * Acknowledge a failed response for a client's request
 *
 * @param {Object} [options]
 * @param {function} [options.callback]
 * @param {Object} [options.extra]
 * @param {string} [options.place=ls_method]
 * @param {string} [options.response="data"]
 */
function fail_response_2(options = {}) {
	const response = {
		place: options.place ? options.place : ls_method,
		response: options.response ? options.response : "data",
		failed: true,
		...(options.extra || {}),
	};

	if (options.callback) {
		options.callback(response);
	} else {
		current_socket.emit("game_response", response);
	}
}

/**
 * Acknowledge a successful response for a client's request
 *
 * @param {Object} [options]
 * @param {function} [options.callback]
 * @param {Object} [options.extra]
 * @param {string} [options.place=ls_method]
 * @param {string} [options.response="data"]
 */
function success_response_2(options = {}) {
	const response = {
		place: options.place ? options.place : ls_method,
		response: options.response ? options.response : "data",
		success: true,
		...(options.extra || {}),
	};

	if (options.callback) {
		options.callback(response);
	} else {
		current_socket.emit("game_response", response);
	}
}
