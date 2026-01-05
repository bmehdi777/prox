package server

import (
	"net/http"
	"time"
)

func MiddlewareDelay(duration time.Duration, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(duration)
		next.ServeHTTP(w, r)
	})
}
