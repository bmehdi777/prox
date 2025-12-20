package server

import (
	"fmt"
	"net/http"
)

func serve() error {
	fullAddr := fmt.Sprintf("%v:%v", "localhost", "3000")
	err := http.ListenAndServe(fullAddr)
	return err
}
