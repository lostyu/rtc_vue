const baseUrl = "http://192.168.0.128:9002";

const api = {
  createVideoRoom: baseUrl + "/personalCenter/createVideoRoom",
  closeVideoRoom: baseUrl + "/personalCenter/closeVideoRoom",
};

function createVideoRoom($, roomId) {
  return $.get({
    url: api.createVideoRoom,
    data: { roomId },
  });
}

function closeVideoRoom($, roomId) {
  return $.post({
    url: api.createVideoRoom,
    data: { roomId },
  });
}
