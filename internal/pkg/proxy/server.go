package proxy

import (
	"fmt"
	"localprox/internal/pkg/config"
	"net/http"
	"time"
)

type RequestResponse struct {
	Req *http.Request
	Res *http.Response
}

var RequestResponseList []RequestResponse

func Serve() error {
	mux := http.NewServeMux()

	m := Middleware{}
	RequestResponseList = make([]RequestResponse, 0)

	mux.Handle("/", m.Log(m.Delay(2*time.Second, m.Redirect(http.HandlerFunc(ok)))))

	server := http.Server{
		Addr:    fmt.Sprintf("%v:%v", config.GlobalConfiguration.Proxy.Addr, config.GlobalConfiguration.Proxy.Port),
		Handler: mux,
	}


	fmt.Printf("Starting proxy server on http://%v:%v\n", config.GlobalConfiguration.Proxy.Addr, config.GlobalConfiguration.Proxy.Port)
	err := server.ListenAndServe()
	return err
}

func ok(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("OK"))
}
