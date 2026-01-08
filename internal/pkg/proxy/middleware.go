package proxy

import (
	"fmt"
	"io"
	"localprox/internal/pkg/config"
	"net/http"
	"strings"
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

func (m *Middleware) RedirectTarget(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response, err := m.redirectRequestToTarget(r)
		if err != nil {
			fmt.Println("Error while redirecting request : ", err)
			next.ServeHTTP(w, r)
			return
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

func (m *Middleware) Redirect(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		response, err := m.redirectRequest(r);
		if err != nil {
			fmt.Println("Error while redirecting request : ", err)
			next.ServeHTTP(w, r)
			return
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

func (m *Middleware) ReplaceBody(newBody string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.Body = io.NopCloser(strings.NewReader(newBody))
		r.ContentLength = int64(len(newBody))

		next.ServeHTTP(w,r)
	})
}


func (m *Middleware) redirectRequest(r *http.Request) (*http.Response, error) {
	request, err := http.NewRequest(r.Method, r.URL.String(), r.Body)
	if err != nil {
		return nil, err
	}

	// Not sure for this one but lets try it
	request.Header.Add("X-Forwarded-For", request.RemoteAddr)

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

func (m *Middleware) redirectRequestToTarget(r *http.Request) (*http.Response, error) {
	targetUrl := fmt.Sprintf("http://%v:%v", config.GlobalConfiguration.Target.Addr, config.GlobalConfiguration.Target.Port) // add missing url part
	request, err := http.NewRequest(r.Method, targetUrl, r.Body)
	if err != nil {
		return nil, err
	}

	request.Header = r.Header.Clone()
	// Not sure for this one but lets try it
	request.Host = fmt.Sprintf("http://%v:%v", config.GlobalConfiguration.Proxy.Addr, config.GlobalConfiguration.Proxy.Port)
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
