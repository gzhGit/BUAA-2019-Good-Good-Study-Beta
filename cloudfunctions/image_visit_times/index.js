// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const request = event.request

  //查找推荐表情
  if (request == 1) {
    const countResult = await db.collection('expression_visit_times').count()
    const total = countResult.total
      // 计算需分几次取
    var batchTimes = Math.ceil(total / 20)
    if (batchTimes==0) {
      batchTimes = 1
    }
    console.log("request=1:",batchTimes)
    var resultArray = []
    for (var i = 0;i < batchTimes;i++) {
      var temp = await db.collection("expression_visit_times").skip(i*100).get()
      console.log("第"+i+"次取,结果为:",temp)
      console.log("temp.data:",temp.data)
      resultArray = resultArray.concat(temp.data)
      /*await db.collection("expression_visit_times").skip(i*100).get({
        success:function(res) {
          console.log("第"+i+"次取,结果为:")
          console.log(res)
          resultArray.concat(res.data)
        }
      })*/ 
    }
    console.log("resultArray:",resultArray)
    return {
      data:resultArray
    }
  }

  //更新关键词检索次数
  else if (request == 2) {
    const tag_search = event.tag
    const countResult = await db.collection('tag_search_times').count()
    const total = countResult.total
      // 计算需分几次取
    var batchTimes = Math.ceil(total / 20)
    if (batchTimes == 0) {
      batchTimes = 1
    }
    for (var i = 0;i < batchTimes;i++) {
      console.log("i:",i)
      var tag_record = await db.collection('tag_search_times').where({
        tag:tag_search
      }).skip(i*100).get()
      console.log("tag_record:",tag_record)
      var tag_record_length = tag_record.data.length
      console.log("data_length:",tag_record_length)
      if ((tag_record_length == 0)&&(i == batchTimes-1)) {
        console.log("no records")
        //添加记录
        await db.collection('tag_search_times').add({
          data:{
            tag:tag_search,
            times:1
          }
        }).then(res=>{
          console.log("第一次搜索该关键词")
        })
      }
      else {
        console.log("get record")
        var _id = tag_record.data[0]._id
        var times = tag_record.data[0].times
        console.log("search times:",times)
        await db.collection('tag_search_times').doc(_id).update({
          data:{
            times:times+1
          }
        }).then(res=>{
          console.log("再次搜索该关键词，次数加一")
        })
      }
    }
    return
  }

  //获取所有关键词检索记录
  else if (request == 3) {
    //获取搜索次数最多的关键词
    const getAmount = 8
    
    const countResult = await db.collection('tag_search_times').count()
    const total = countResult.total
      // 计算需分几次取
    var batchTimes = Math.ceil(total / 20)
    if (batchTimes == 0) {
      batchTimes = 1
    }
    var resultArray = []
    var resultLength = 0
    for (var i = 0;i < batchTimes;i++) {
      var temp = await db.collection('tag_search_times').limit(32).
        orderBy("times","desc").skip(i*batchTimes).get()
      console.log("取一次关键词记录:",temp)
      resultLength = resultLength + temp.data.length
      console.log("temp_length:",resultLength)
      resultArray = resultArray.concat(temp.data)
      if (resultLength > 0) {
        break
      }
    }
    console.log("resultArray:",resultArray)
    return {
      data:resultArray
    }
  }

  const countResult = await db.collection('expression_visit_times').count()
  const total = countResult.total
      // 计算需分几次取
  var batchTimes = Math.ceil(total / 20)
  const filetag = event.tag 
  const fileid = event.id
  
  if (batchTimes==0) {
    batchTimes = 1
  }
  console.log("batchtimes:",batchTimes)
  console.log("fileid:",fileid)
  console.log("filetag:",filetag)
  for (var i = 0;i < batchTimes;i++) {
    console.log("i:",i)
    var isnull = 0
    var res = await db.collection("expression_visit_times").where({
      id:fileid
    }).skip(i*100).get()
    console.log("res.data:",res)         
    if ((res.data[0] == null) && (i == batchTimes-1)) {
      await db.collection('expression_visit_times').add({
      // data 字段表示需新增的 JSON 数据
      data: {
                // _id: 'todo-identifiant-aleatoire', // 可选自定义 _id，在此处场景下用数据库自动分配的就可以了
        id:fileid,
        tag:filetag,
        times:1
      }
      }).then(res=>{
        console.log("第一次访问表情")
        console.log(res)
      })
    }
    else {
            visits = res.data[0].times
            console.log("visits:",res.data[0].times)
            console.log("visits2:",visits)
            visits++
            _id = res.data[0]._id
            console.log("_id:",_id)

            try{
            //为什么where子句加set不可以？
            await db.collection('expression_visit_times').doc(_id).set({
              data:{
                id:fileid,
                tag:filetag,
                times:visits
              }
            }).then(res=>{
              console.log("跟新成功")
            })}catch(e) {
            console.log(e)
          }
    }
  }
  

  /*return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }*/
}