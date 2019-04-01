export const socketService = {
  subscribe
};

function subscribe(callback) {
  const socket = new WebSocket(`ws://${window.location.host}/api/notifications`);

  socket.onopen = function() {
    let subscribeMessage = {
      event: "block",
      channel: "common"
    };

    socket.send(JSON.stringify(subscribeMessage))
  };

  socket.onmessage = function (event) {

    let eventData = JSON.parse(event.data);
    console.log(eventData.event_type, eventData.event_type === "block");
    if(eventData.event_type === "block") {
      callback();
    }
  }
}
