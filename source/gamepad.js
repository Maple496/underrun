
// Gamepad support (twin-stick):
//	left stick / d-pad: move		right stick: aim
//	A / RB / RT: shoot				Start: confirm (= mouse click)
//
// Browsers expose no events for button state, so the pad is polled on a
// timer. Polling deliberately uses setTimeout instead of
// requestAnimationFrame to keep input state fresh even when the browser
// suspends rendering for an occluded/minimized window.
//
// Pad state lives in its own map and is merged into `keys` through a
// Proxy, so releasing pad inputs clears only the pad's own flags and
// keyboard/mouse handlers in game.js stay untouched. Removing this file
// and its script tag reverts to keyboard/mouse-only input.

var keys_pad = {},
	keys_pad_deadzone = 0.3,
	keys_pad_aim_deadzone = 0.25,
	keys_pad_start_held = 0;

keys = new Proxy(keys, {
	get: function(target, key) {
		return (target[key] || 0) | (keys_pad[key] || 0);
	},
	set: function(target, key, value) {
		target[key] = value;
		return true;
	}
});

function gamepad_poll() {
	setTimeout(gamepad_poll, 1000/60);

	var pads = navigator.getGamepads ? navigator.getGamepads() : [],
		pad = null,
		i;

	for (i = 0; i < pads.length; i++) {
		if (pads[i] && pads[i].connected) {
			pad = pads[i];
			break;
		}
	}

	// no gamepad (yet) - make sure no stale input lingers
	if (!pad) {
		for (var k in keys_pad) {
			keys_pad[k] = 0;
		}
		return;
	}

	var buttons = pad.buttons,
		axes = pad.axes || [],
		pressed = function(n) { return !!(buttons[n] && buttons[n].pressed); };

	// standard mapping: d-pad is 12=up 13=down 14=left 15=right,
	// axes 0/1 are the left stick
	keys_pad[key_left] = pressed(14) || (axes[0] || 0) < -keys_pad_deadzone ? 1 : 0;
	keys_pad[key_up] = pressed(12) || (axes[1] || 0) < -keys_pad_deadzone ? 1 : 0;
	keys_pad[key_right] = pressed(15) || (axes[0] || 0) > keys_pad_deadzone ? 1 : 0;
	keys_pad[key_down] = pressed(13) || (axes[1] || 0) > keys_pad_deadzone ? 1 : 0;

	// A(0) / RB(5) / RT(7, analog) shoot
	keys_pad[key_shoot] =
		pressed(0) || pressed(5) || (buttons[7] && buttons[7].value > 0.5) ? 1 : 0;

	// right stick (axes 2/3) aims around the player's on-screen position
	// (see entity-player.js); the last direction is kept on release
	var aim_x = axes[2] || 0,
		aim_y = axes[3] || 0;

	if (aim_x*aim_x + aim_y*aim_y > keys_pad_aim_deadzone*keys_pad_aim_deadzone) {
		mouse_x = c.width/2 + aim_x * 80;
		mouse_y = c.height*0.8 - 34 + aim_y * 80;
	}

	// Start(9) acts as the mouse click required to deploy/confirm
	var start = pressed(9);
	if (start && !keys_pad_start_held) {
		_document.dispatchEvent(new MouseEvent('click'));
	}
	keys_pad_start_held = start;
}

gamepad_poll();
