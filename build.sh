cat \
	source/game.js \
	source/random.js \
	source/renderer.js \
	source/entity.js \
	source/entity-player.js \
	source/entity-cpu.js \
	source/entity-plasma.js \
	source/entity-spider.js \
	source/entity-sentry.js \
	source/entity-particle.js \
	source/entity-health.js \
	source/entity-explosion.js \
	source/sonantx-reduced.js \
	source/music-dark-meat-beat.js \
	source/sound-effects.js \
	source/audio.js \
	source/terminal.js \
	source/gamepad.js \
	source/main.js \
	> build/underrun.js

node shrinkit.js build/underrun.js > build/underrun.compact.js

./node_modules/uglify-es/bin/uglifyjs build/underrun.compact.js \
	--compress --screw-ie8 --mangle toplevel -c --beautify --mangle-props regex='/^_/;' \
	-o build/underrun.min.beauty.js
	
./node_modules/uglify-es/bin/uglifyjs build/underrun.compact.js \
	--compress --screw-ie8 --mangle toplevel --mangle-props regex='/^_/;' \
	-o build/underrun.min.js


rm -f build/underrun.zip

sed -e '/GAME_SOURCE/{r build/underrun.min.js' -e 'd}' source/html-template.html > underrun.html

# the zip is only needed for the 13kb submission; `zip` may not exist on Windows
if command -v zip > /dev/null; then
	zip -9 build/underrun.zip m/q2.png m/l1.png m/l2.png m/l3.png underrun.html
else
	echo "(zip not found - skipping build/underrun.zip, html is still built)"
fi
ls -la build/
mv underrun.html build/underrun.html
