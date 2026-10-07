
var terminal_text_ident = '&gt; ';
var terminal_text_title = '' +
	'UNDERRUN\n' +
	'__ \n' +
	'概念 / 画面 / 程序：\n' +
	'DOMINIC SZABLEWSKI // PHOBOSLAB.ORG\n' +
	'__ \n' +
	'音乐：\n' +
	'ANDREAS LÖSCH // NO-FATE.NET\n' +
	'___ \n' +
	'系统版本: 13.20.18\n' +
	'CPU: PL(R) Q-COATL 7240 @ 12.6 THZ\n' +
	'内存: 108086391056891900 字节\n' +
	' \n' +
	'正在连接...';

var terminal_text_garbage = 
	'´A1e{∏éI9·NQ≥ÀΩ¸94CîyîR›kÈ¡˙ßT-;ûÅf^˛,¬›A∫Sã€«ÕÕ' +
	'1f@çX8ÎRjßf•ò√ã0êÃcÄ]Î≤moDÇ’ñ‰\\ˇ≠n=(s7É;';

var terminal_text_story = 
	'日期: 2718 年 9 月 13 日 - 13:32\n' +
	'检测到关键软件故障\n' +
	'分析中...\n' +
	'____\n \n' +
	'ERROR CODE: JS13K2018\n' +
	'状态: 系统全部离线\n' +
	'故障描述: 卫星链路 R.U.D. 导致缓冲区欠载\n' +
	'受影响系统: 设施自动化\n' +
	'受影响子系统: AI、辐射护盾、电力管理\n' +
	' \n' +
	'正在启动救援系统...\n' +
	'___' +
	'失败\n \n' +
	'正在尝试自动重启...\n' +
	'___' +
	'失败\n' +
	'_ \n \n' +
	'需要手动重启全部系统\n' +
	'_ \n' +
	'用 WASD 或方向键移动，鼠标射击\n' +
	'点击开始部署\n ';

var terminal_text_outro = 
	'全部卫星链路在线\n' +
	'连接中...___' +
	'连接已建立\n' +
	'正在接收传输...___ \n' +
	
	'发送: 2018 年 9 月 13 日\n' +
	'接收: 2718 年 9 月 13 日\n \n' +
	
	'感谢游玩 ❤_ \n' +
	'自 2012 年首届 JS13K 竞赛起，我一直自豪地赞助\n' +
	'这项赛事。\n' +
	'而今年是我首次以参赛者身份参与，\n' +
	'整个过程充满了乐趣!\n \n' +
	
	'我要感谢挚友 NO-FATE.NET 的 ANDREAS LÖSCH，\n' +
	'感谢他在极短时间内谱写出出色的音乐。\n' + 
	'\n \n' +

	'同样感谢 JS13K 工作人员、SONANT-X 开发者\n' +
	'以及本届 JS13K 的所有参赛者。\n' +
	'明年再见!\n \n' +
	'DOMINIC__' +
	'传输结束（汉化：AI 工程工坊）';

var terminal_text_buffer = [],
	terminal_state = 0,
	terminal_current_line,
	terminal_line_wait = 100,
	terminal_print_ident = true,
	terminal_timeout_id = 0,
	terminal_hide_timeout = 0;

terminal_text_garbage += terminal_text_garbage + terminal_text_garbage;

function terminal_show() {
	clearTimeout(terminal_hide_timeout);
	a.style.opacity = 1;
	a.style.display = 'block';
}

function terminal_hide() {
	a.style.opacity = 0;
	terminal_hide_timeout = setTimeout(function(){a.style.display = 'none'}, 1000);
}

function terminal_cancel() {
	clearTimeout(terminal_timeout_id);
}

function terminal_prepare_text(text) {
	return text.replace(/_/g, '\n'.repeat(10)).split('\n');
}

function terminal_write_text(lines, callback) {
	if (lines.length) {
		terminal_write_line(lines.shift(), terminal_write_text.bind(this, lines, callback));
	}
	else {
		callback && callback();
	}
}

function terminal_write_line(line, callback) {
	if (terminal_text_buffer.length > 20) {
		terminal_text_buffer.shift();
	}
	if (line) {
		audio_play(audio_sfx_terminal);
		terminal_text_buffer.push((terminal_print_ident ? terminal_text_ident : '') + line);
		a.innerHTML = '<div>'+terminal_text_buffer.join('&nbsp;</div><div>')+'<b>█</b></div>';
	}
	terminal_timeout_id = setTimeout(callback, terminal_line_wait);
}

function terminal_show_notice(notice, callback) {
	a.innerHTML = '';
	terminal_text_buffer = [];

	terminal_cancel();
	terminal_show();
	terminal_write_text(terminal_prepare_text(notice), function(){
		terminal_timeout_id = setTimeout(function(){
			terminal_hide();
			callback && callback();
		}, 2000);
	});
}

function terminal_run_intro(callback) {
	terminal_text_buffer = [];
	terminal_write_text(terminal_prepare_text(terminal_text_title), function(){
		terminal_timeout_id = setTimeout(function(){
			terminal_run_garbage(callback);
		}, 4000);
	});
}

function terminal_run_garbage(callback) {
	terminal_print_ident = false;
	terminal_line_wait = 16;

	var t = terminal_text_garbage,
		length = terminal_text_garbage.length;

	for (var i = 0; i < 64; i++) {
		var s = (_math.random()*length)|0;
		var e = (_math.random()*(length - s))|0;
		t += terminal_text_garbage.substr(s, e) + '\n';
	}
	t += ' \n \n';
	terminal_write_text(terminal_prepare_text(t), function(){
		terminal_timeout_id = setTimeout(function(){
			terminal_run_story(callback);
		}, 1500);
	});
}

function terminal_run_story(callback) {
	terminal_print_ident = true;
	terminal_line_wait = 100;
	terminal_write_text(terminal_prepare_text(terminal_text_story), callback);
}

function terminal_run_outro(callback) {
	c.style.opacity = 0.3;
	a.innerHTML = '';
	terminal_text_buffer = [];

	terminal_cancel();
	terminal_show();
	terminal_write_text(terminal_prepare_text(terminal_text_outro));
}
