CONTENTS = icons js l10n app.css COPYING.txt index.html manifest.webapp sudoku.css sudoku.png

.PHONY: all
all: sudoku.zip sudoku.manifest.webapp github.manifest.webapp

.PHONY: clean
clean:
	find . -name '*~' -delete

.PHONY: icons
icons: icons/icon-128.png icons/icon-512.png

icons/icon-128.png: icon.svg
	rsvg-convert -w 128 icon.svg -o icons/icon-128.png
	optipng icons/icon-128.png

icon/icon-512.png: icon.svg
	rsvg-convert -w 512 icon.svg -o icons/icon-512.png
	optipng icons/icon-512.png

sudoku.zip: clean icons $(CONTENTS)
	rm -f sudoku.zip
	zip -r sudoku.zip $(CONTENTS)

sudoku.manifest.webapp: manifest.webapp
	sed manifest.webapp -e 's/"launch_path"\s*:\s*"[^"]*"/"package_path": "http:\/\/localhost:8080\/sudoku.zip"/' > sudoku.manifest.webapp

github.manifest.webapp: manifest.webapp
	sed manifest.webapp -e 's/"launch_path"\s*:\s*"[^"]*"/"package_path": "https:\/\/schnark.github.io\/sudoku\/sudoku.zip"/' > github.manifest.webapp
