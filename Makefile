
top := $(CURDIR)

JSHINT = $(top)/node_modules/.bin/jshint
MOCHA = $(top)/node_modules/.bin/mocha

src = $(top)/blockhash.js

# Modules should add files to be checked with jshint
jshint-files = $(src) $(mocha-files)

# Modules should add files to be run as unit tests
mocha-files = $(top)/test/tests.js

REPORTER=
ifeq ($(EMACS),t)
REPORTER=--reporter=.jshint-emacs.js
endif

all: lint

clean:

lint:
	$(JSHINT) $(REPORTER) $(jshint-files)

test:
	$(MOCHA) $(MOCHA_FLAGS) $(mocha-files)

.PHONY: all clean lint test
