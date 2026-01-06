package main

import (
	"fmt"
	"localprox/internal/pkg/client"
	"localprox/internal/pkg/config"
	"localprox/internal/pkg/proxy"
	"os"
)

func main() {
	config.InitConfig()

	if config.GlobalConfiguration.Client.Enabled {
		go func() {
			err := client.Serve()
			if err != nil {
				fmt.Println("Front error : ", err)
				os.Exit(1)
			}
		}()
	}

	err := proxy.Serve()
	if err != nil {
		fmt.Println("Error : ", err)
		os.Exit(1)
	}
}
