.PHONY: build clean test prepare assets

prepare:
	go mod tidy

build:
	go build -o dist/prox cmd/prox/main.go

assets:
	pnpm -C assets build
	rm -rf ./internal/pkg/client/dist
	cp -r ./assets/dist ./internal/pkg/client/

run: 
	go tool air -c .air.toml 

clean: 
	rm -rf ./dist/prox

test:
	go test -v ./internal/pkg
