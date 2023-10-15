EXPORT_DIR = $(OUT_DIR)/fsmD
BUILD_DIR = $(CURDIR)/docs

all: init build copy

init:
	mkdir -p $(EXPORT_DIR)

build:
	npm install
	npm run build

copy: build
	cp -r $(BUILD_DIR)/* $(EXPORT_DIR)
