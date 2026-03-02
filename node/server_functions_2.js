/**
 * Acknowledge a failed response for a client's request
 *
 * @param {Object} options
 * @param {string} options.place
 * @param {string} [options.response="data"]
 * @param {function} [options.callback]
 * @param {Object} [options.extra]
 */
function fail_response_2(current_socket, options) {
	const response = {
		place: options.place,
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
 * @param {Object} options
 * @param {string} options.place
 * @param {string} [options.response="data"]
 * @param {Object} [options.extra]
 * @param {function} [options.callback]
 */
function success_response_2(current_socket, options) {
	const response = {
		place: options.place,
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

module.exports = {
	fail_response_2,
	success_response_2,
};
