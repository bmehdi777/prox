package websocket

import (
	"fmt"
	"localprox/internal/pkg/proxy"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	defer conn.Close()

	for {
		select {
		case <-proxy.RRLChannel:
			fmt.Println("Here?")
			rrlMsg := Message{
				MsgType: REQUEST,
				Content: proxy.RequestResponseList,
			}
			fmt.Println("RRL MSG", rrlMsg.Content)
			conn.WriteJSON(rrlMsg)
		default:
			fmt.Println("Waiting for data")
			time.Sleep(time.Second)
		}
	}

}
