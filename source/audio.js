// 无 AudioContext 环境（无头验证/受限沙箱）回退：静音 dummy，游戏可玩
var audio_ctx = null,
	audio_music_dark_meat_beat = null,
	audio_sfx_shoot = null,
	audio_sfx_hit = null,
	audio_sfx_hurt = null,
	audio_sfx_beep = null,
	audio_sfx_pickup = null,
	audio_sfx_terminal = null,
	audio_sfx_explode = null;
try {
	audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
	audio_ctx = {
		destination: {},
		createBuffer: function (c, n) { return { getChannelData: function () { return new Float32Array(n); } }; },
		createBufferSource: function () { return { connect: function () {}, start: function () {}, stop: function () {}, buffer: null, loop: false }; },
		createGain: function () { return { connect: function () {}, gain: {} }; }
	};
}

function audio_init(callback) {
	sonantxr_generate_song(audio_ctx, music_dark_meat_beat, function(buffer){
		audio_play(buffer, true);
		callback();
	});
	sonantxr_generate_sound(audio_ctx, sound_shoot, 140, function(buffer){
		audio_sfx_shoot = buffer;
	});
	sonantxr_generate_sound(audio_ctx, sound_hit, 134, function(buffer){
		audio_sfx_hit = buffer;
	});
	sonantxr_generate_sound(audio_ctx, sound_beep, 173, function(buffer){
		audio_sfx_beep = buffer;
	});
	sonantxr_generate_sound(audio_ctx, sound_hurt, 144, function(buffer){
		audio_sfx_hurt = buffer;
	});
	sonantxr_generate_sound(audio_ctx, sound_pickup, 156, function(buffer){
		audio_sfx_pickup = buffer;
	});
	sonantxr_generate_sound(audio_ctx, sound_terminal, 156, function(buffer){
		audio_sfx_terminal = buffer;
	});
	sonantxr_generate_sound(audio_ctx, sound_explode, 114, function(buffer){
		audio_sfx_explode = buffer;
	});
};

function audio_play(buffer, loop) {
	var source = audio_ctx.createBufferSource();
	source.buffer = buffer;
	source.loop = loop;
	source.connect(audio_ctx.destination);
	source.start();
};