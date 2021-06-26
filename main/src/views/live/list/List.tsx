import * as React from "react";
import { Location } from "history";
import { Helmet } from "react-helmet";
import { parse } from "query-string";
import { History } from "history";
import { Link } from "react-router-dom";

import Context from "@context/index";
import { getLiveListData } from "@api/live";
import getLiveListInfo from "@redux/async-action-creators/live/list";
import { setShouldLoad } from "@redux/action-creators";

import LoadingCutscene from "@components/loading-cutscene/LoadingCutscene";
import ScrollToTop from "@components/scroll-to-top/ScrollToTop";
import Nav from "../child-components/nav/Nav"
import LiveInfo from "../child-components/liveinfo/LiveInfo";

import { Live, UpUser, PartitionType, LiveSecQueryParType } from "@class-object-creators/index";
import style from "./list.styl?css-modules";

interface ListProps {
  shouldLoad: boolean;
  liveListData: {
    total: number,
    list: Array<Live>
  };
  liveLvTwoTabs: PartitionType[];
  liveLvTwoQueries: LiveSecQueryParType[];
  location: Location;
  dispatch: (action: any) => Promise<void>;
  history: History;
  lvOneTabs: PartitionType[];
}

const { useState, useRef, useEffect } = React;

function List(props: ListProps) {
  const { shouldLoad, liveListData, location, dispatch, lvOneTabs, history,
    liveLvTwoTabs, liveLvTwoQueries } = props;
  const query = parse(location.search);

  const [isMounted, setIsMounted] = useState(false);
  const [lives, setLives] = useState(null);
  const [livePage, setLivePage] = useState({ pageNumber: 1, pageSize: 30, totalPage: 1 });
  const [loading, setLoading] = useState(false);
  const roomContainerRef: React.MutableRefObject<HTMLDivElement> = useRef(null);

  const listDataRef = useRef(null);
  useEffect(() => { listDataRef.current = liveListData }, [liveListData]);

  const getLives = () => {
    // getLiveListData({
    //   parentAreaId: query.parent_area_id,
    //   areaId: query.area_id,
    //   page: livePage.pageNumber,
    //   pageSize: livePage.pageSize
    // })
    dispatch(getLiveListInfo({
      parentAreaId: parseInt(query.parent_area_id as string),
      areaId: parseInt(query.area_id as string),
      page: livePage.pageNumber,
      pageSize: livePage.pageSize
    })).then(() => {
      const temp = { ...livePage };
      // temp.totalPage = Math.ceil(result.data.count / livePage.pageSize);
      ++temp.pageNumber;
      setLivePage(temp);

      setLives(lives.concat(liveListData.list));
      setLoading(false);
    });
  };

  useEffect(() => {
    setIsMounted(true);

    if (shouldLoad) {
      dispatch(getLiveListInfo({
        parentAreaId: parseInt(query.parent_area_id as string),
        areaId: parseInt(query.area_id as string),
        page: livePage.pageNumber,
        pageSize: livePage.pageSize
      })).then(() => setTimeout(() => setLives(listDataRef.current.list)));
    } else {
      setLives(liveListData.list)
      const temp = { ...livePage };
      temp.pageNumber = 2; // 服务端渲染时已加载第一页数据
      setLivePage(temp);
      dispatch(setShouldLoad(true));
    }
  }, []);

  // 切换二级tab后重置pageNumber、清空之前的lives
  // useEffect(() => {
  //   if (!firstTimeRender) {
  //     const temp = { ...livePage };
  //     temp.pageNumber = 1;
  //     setLivePage(temp);
  //     setLives([]); // 这里清空生效太慢加setTimeout都不行，所以只能再用另一个useEffect模拟setState回调
  //   } else {
  //     setFirstTimeRender(false);
  //   }
  // }, [location.key]);
  // 切换二级tab后获取新的lives数据
  // useEffect(() => {
  //   // console.log(lives)
  //   //  判断length的作用：getLives后将继续触发该useEffect，形成死循环
  //   !firstTimeRender && lives.length === 0 && getLives();
  // }, [lives?.length]);

  const handleLvTwoClick = () => {
    const temp = { ...livePage };
    temp.pageNumber = 1;
    setLivePage(temp);
    setLives([]); // 这里清空生效太慢加setTimeout都不行，所以只能再用另一个useEffect模拟setState回调
  }

  const [firstTimeRender, setFirstTimeRender] = useState(true);
  useEffect(() => {
    console.log(lives)
    //  判断length的作用：getLives后将继续触发该useEffect，形成死循环
    if (firstTimeRender) {
      setFirstTimeRender(false);
    } else {
      lives.length === 0 && getLives();
    }
  }, [lives?.length]);

  return (
    <>
      {!shouldLoad && !isMounted ? <LoadingCutscene /> :
        < >
          <Helmet><title>直播-{query.area_name ? query.area_name : query.parent_area_name}</title></Helmet>
          <div className={style.head}>
            <Nav history={history} firstTabBarData={lvOneTabs} handleLvTwoClick={handleLvTwoClick}
              lvTwoTabBarData={liveLvTwoTabs} secondQueryPar={liveLvTwoQueries}
            />
          </div>
          <Context.Consumer>
            {context => (
              <section className={style.main} ref={roomContainerRef}>
                <div className={style.roomContainer}>
                  {/* 分类名称 */}
                  <h4 className={style.title}>{query.area_name ? query.area_name : query.parent_area_name}</h4>
                  {/* 房间列表 */}
                  <div className={style.rooms}>
                    {lives?.map(data => {
                      if (data.cover.indexOf(context.picURL) === -1) {
                        data.cover = `${context.picURL}?pic=${data.cover}`;
                      }
                      return (
                        <Link className={style.roomWrapper} key={data.roomId} to={`/live/${data.roomId}`}>
                          <LiveInfo data={data} />
                        </Link>
                      )
                    })}
                  </div>
                </div>
                {/* 加载更多 */}
                {lives?.length > 0 && livePage.totalPage > 1 &&
                  <div className={style.loadMore}>
                    <div className={style.loadBtn} onClick={() => {
                      if (livePage.pageNumber <= livePage.totalPage) {
                        setLoading(true);
                        getLives();
                      }
                    }}>
                      {loading ? "加载中..." : livePage.pageNumber <= livePage.totalPage ?
                        "请给我更多！" : "没有更多了"
                      }
                    </div>
                  </div>
                }
              </section>
            )}
          </Context.Consumer>
          <ScrollToTop />
        </>
      }
    </>
  );
}

export default List;