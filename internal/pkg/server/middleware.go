package server

import (
	"fmt"
	"io"
	"localprox/internal/pkg/config"
	"net/http"
	"time"
)

type Middleware struct {
	client http.Client
}

func NewMiddleware() *Middleware {
	client := http.Client{}

	return &Middleware{
		client,
	}
}

func (m *Middleware) Redirect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response, err := m.redirectRequest(r)
		if err != nil {
			fmt.Println("Error while redirecting request : ", err)
		}

		for key, values := range response.Header {
			w.Header()[key] = values
		}

		// send it back response baby
		w.WriteHeader(response.StatusCode)
		io.Copy(w, response.Body)

		next.ServeHTTP(w, r)
	})
}

func (m *Middleware) Delay(duration time.Duration, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(duration)
		next.ServeHTTP(w, r)
	})
}

func (m *Middleware) Log(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Request received : ", r)
		next.ServeHTTP(w, r)
	})
}

func (m *Middleware) redirectRequest(r *http.Request) (*http.Response, error) {
	targetUrl := fmt.Sprintf("http://%v:%v", config.GlobalConfiguration.TargetAddr, config.GlobalConfiguration.TargetPort)
	request, err := http.NewRequest(r.Method, targetUrl, r.Body)
	if err != nil {
		return nil, err
	}

	request.Header = r.Header.Clone()
	// Not sure for this one but lets try it
	request.Host = fmt.Sprintf("http://%v:%v", config.GlobalConfiguration.ProxyAddr, config.GlobalConfiguration.ProxyPort)
	request.Header.Add("X-Forwarded-For", r.RemoteAddr)

	request.Header.Del("Connection")
	request.Header.Del("Keep-Alive")
	request.Header.Del("Proxy-Authenticate")
	request.Header.Del("Proxy-Authorization")
	request.Header.Del("TE")
	request.Header.Del("Trailers")
	request.Header.Del("Transfer-Encoding")
	request.Header.Del("Upgrade")

	response, err := m.client.Do(request)
	if err != nil {
		return nil, err
	}

	return response, nil
}
