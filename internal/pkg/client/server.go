package client

import (
	"embed"
	"fmt"
	"io/fs"
	"localprox/internal/pkg/config"
	"net/http"
)

//go:embed all:dist
var distFolder embed.FS

func Serve() error {
	assets, err := fs.Sub(distFolder, "dist")
	if err != nil {
		return err
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		httpHandleAssets(w, r, assets, "/")
	})

	fmt.Printf("Starting client server on http://%v:%v\n", config.GlobalConfiguration.Client.Addr, config.GlobalConfiguration.Client.Port)
	err = http.ListenAndServe(fmt.Sprintf("%v:%v", config.GlobalConfiguration.Client.Addr, config.GlobalConfiguration.Client.Port), mux)
	if err != nil {
		return err
	}

	return nil
}
