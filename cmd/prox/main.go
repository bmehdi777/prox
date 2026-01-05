package main

import (
	"fmt"
	"localprox/internal/pkg/server"
	"os"
)

func main() {
	err := server.Serve()
	if err != nil {
		fmt.Println("Error : ", err)
		os.Exit(1)
	}
}
