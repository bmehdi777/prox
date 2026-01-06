package config

import (
	"log"

	"github.com/spf13/viper"
)

type ClientConfig struct {
	Enabled bool `json:"enabled"`
	Addr string `json:"addr"`
	Port string `json:"port"`
}

type TargetConfig struct {
	Addr string `json:"addr"`
	Port string `json:"port"`
}

type ProxyConfig struct {
	Addr string `json:"addr"`
	Port string `json:"port"`
}

type Config struct {
	Proxy ProxyConfig `json:"proxy"`
	Target TargetConfig `json:"target"`
	Client ClientConfig `json:"client"`
}

var GlobalConfiguration Config

func InitConfig() {
	GlobalConfiguration = Config {
		Proxy: ProxyConfig{
			Addr:"0.0.0.0",
			Port:"3000",
		},
		Target: TargetConfig{
			Addr:"localhost",
			Port:"3030",
		},
		Client: ClientConfig{
			Enabled: true,
			Addr:"localhost",
			Port:"9090",
		},
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
}
