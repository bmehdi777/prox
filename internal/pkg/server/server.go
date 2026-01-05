package server

import (
	"fmt"
	"localprox/internal/pkg/config"
	"net/http"
	"time"
)

func Serve() error {
	config.InitConfig()

	mux := http.NewServeMux()

	m := Middleware{}

	mux.Handle("GET /", m.Log(m.Delay(2*time.Second, m.Redirect(http.HandlerFunc(ok)))))

	server := http.Server{
		Addr:    fmt.Sprintf("%v:%v", config.GlobalConfiguration.ProxyAddr, config.GlobalConfiguration.ProxyPort),
		Handler: mux,
	}

	err := server.ListenAndServe()
	return err
}

func ok(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("OK"))
}
