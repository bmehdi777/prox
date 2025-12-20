.PHONY: build clean test prepare

prepare:
	go mod tidy

build:
	go build -o dist/prox cmd/prox/main.go

run: 
	go tool air -c .air.toml 

clean: 
	rm -rf ./dist/prox

test:
	go test -v ./internal/pkg
