package config

import (
	"fmt"
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	ProxyAddr string `json:"proxy_addr"`
	ProxyPort string `json:"proxy_port"`
	TargetAddr string `json:"target_addr"`
	TargetPort string `json:"target_port"`
}

var GlobalConfiguration Config

func InitConfig() {
	GlobalConfiguration = Config {
		ProxyAddr:"0.0.0.0",
		ProxyPort:"3000",
		TargetAddr:"localhost",
		TargetPort:"3030",
	}

	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("/etc/prox/")
	viper.AddConfigPath("$HOME/.config/prox/")
	viper.AddConfigPath(".")
	viper.ReadInConfig()
	err := viper.Unmarshal(&GlobalConfiguration)
	if err != nil {
		log.Fatalf("Unable to unmarshal config file : %v", err)
	}

	fmt.Println("Conf: ", GlobalConfiguration.TargetAddr)

	verify()
}

func verify() {
	if GlobalConfiguration.TargetAddr == ""{
		log.Fatal("`TargetAddr` must be completed.")
	}

	if GlobalConfiguration.TargetPort == ""{
		log.Fatal("`TargetPort` must be completed.")
	}
}
