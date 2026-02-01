package websocket

type MessageType int

const (
	// Request part
	REQUEST MessageType = iota


	// Log part
	LOG 

	// Script part
)

type Message struct {
	MsgType MessageType `json:"message_type"`
	Content interface{} `json:"content"`
}
