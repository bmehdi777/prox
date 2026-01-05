package server

import (
	"fmt"
	"net/http"
	"time"
)

func Serve() error {
	mux := http.NewServeMux()

	mux.Handle("GET /", MiddlewareDelay(2 * time.Second, http.HandlerFunc(test)))

	server := http.Server{
		Addr:    fmt.Sprintf("%v:%v", "localhost", "3000"),
		Handler: mux,
	}

	err := server.ListenAndServe()
	return err
}

func test(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Intercept request from : ", r.Host)
	fmt.Println("Redirecting to localhost:5000")

	w.Write([]byte("OK"))
}
