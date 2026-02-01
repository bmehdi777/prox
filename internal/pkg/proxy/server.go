package proxy

import (
	"fmt"
	"localprox/internal/pkg/config"
	"net/http"
	"time"
)

type RequestResponse struct {
	// Need to convert it to binary or text
	// Req *http.Request
	// Res *http.Response

	Id             int
	Method         string
	Url            string
	Status         int
	Duration       int
	RequestHeader  string
	RequestBody    string
	ResponseHeader string
	ResponseBody   string
}

// { id: 1, method: "GET", url: "https://api.example.com/users", status: 200, duration: "120ms", requestHeaders: defaultRequestHeaders, responseHeaders: defaultResponseHeaders },

var RequestResponseList []RequestResponse
var RRLChannel chan int

func Serve() error {
	mux := http.NewServeMux()

	m := Middleware{}
	RequestResponseList = make([]RequestResponse, 0)
	RRLChannel = make(chan int)

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
