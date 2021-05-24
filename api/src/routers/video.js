const express = require("express");
const {
  fetchVideoDetail,
  fetchPlayUrl,
  fetchRecommendById,
  fetchReplay,
  fetchBarrage,
  postViewedReport
} = require("../api");
// xml2js的作用是将后台返回的 xml 代码转换为前台可使用的 json 格式的字符串
const { parseString } = require("xml2js");
const router = express.Router();

// 视频详情
router.get("/av/:aId", (req, res, next) => {
  // 这里排除的大概是番剧、电影
  if (req.path == "/av/replay" || req.path == "/av/play_url") {
    // 这里的next是跳到下一个中间件，也就是/av/play_url，而不是fetchVideoDetail
    next();
    return;
  }
  fetchVideoDetail(req.params.aId).then((data) => {
    const resData = {
      code: "1",
      msg: "success",
      data
    }
    if (data.code === 0) {
      resData.data = data.data;
    } else {
      resData.code = "0";
      resData.msg = "fail";
    }
    res.send(resData);
  }).catch(next);
});

// 视频地址
router.get("/av/play_url", (req, res, next) => {
  fetchPlayUrl(req.query.aId, req.query.cId).then((data) => {
    let resData = {
      code: "1",
      msg: "success"
    }
    if (data.code === 0) {
      resData.data = data.data;
    } else {
      resData.code = "0";
      resData.msg = "fail";
    }
    res.send(resData);
  }).catch(next);
});

router.get("/av/recommend/:aId", (req, res, next) => {
  fetchRecommendById(req.params.aId).then((data) => {
    let resData = {
      code: "1",
      msg: "success"
    }
    if (data.code === 0) {
      resData.data = data.data;
    } else {
      resData.code = "0";
      resData.msg = "fail";
    }
    res.send(resData);
  }).catch(next);
});

router.get("/av/replay", (req, res, next) => {
  let aId = req.query.aId;
  let p = req.query.p;
  fetchReplay(aId, p).then((data) => {
    let resData = {
      code: "1",
      msg: "success"
    }
    if (data.code === 0) {
      resData.data = data.data;
    } else {
      resData.code = "0";
      resData.msg = "fail";
    }
    res.send(resData);
  }).catch(next);
});

router.get("/av/barrage/:cId", (req, res, next) => {
  fetchBarrage(req.params.cId).then((xml) => {
    parseString(xml, { explicitArray: false, trim: true }, (err, result) => {
      if (!err) {
        let resData = {
          code: "1",
          msg: "success",
          data: []
        }
        if (result.i.d) {
          result.i.d.forEach(item => {
            let p = item.$.p;
            let attrs = p.split(",");
            resData.data.push({
              time: attrs[0],  // 时间
              type: attrs[1],  // 类型
              decimalColor: attrs[3],  // 十进制颜色
              sendTime: attrs[4],   // 发送时间
              content: item._,  // 内容
              p
            });
          });
        }
        res.send(resData);
      } else {
        next(err);
      }
    });

  }).catch(next);
});

router.post("/av/report", (req, res, next) => {
  console.log(req.body)
  postViewedReport(req.body, req.headers.cookie).then(data => {
    let resData = {
      code: "1",
      msg: "success",
    }
    if (data.code != 0) {
      resData.code = "0";
      resData.msg = "fail";
    }
    resData.data = data;

    res.send(resData);
  }).catch(next);
});

module.exports = router;
