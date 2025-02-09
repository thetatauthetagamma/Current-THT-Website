import * as d3 from "d3";
import supabase from "../../supabase";
import React, { useState, useEffect, useRef } from "react";
import Tree from "react-d3-tree";
import BroNavBar from "@/components/BroNavBar";
import Cookies from "js-cookie";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
  Button,
  SearchIcon,
  Input,
  Tooltip,
} from "@nextui-org/react";
import { InfoIcon } from "@nextui-org/shared-icons";

// Same expand/collapse helpers
function expand(d) {
  if (d._children) {
    d.children = d._children;
    d._children = null;
  }
  const children = d.children || d._children;
  if (children) children.forEach((item) => expand(item));
}
function collapse(d, lineage) {
  if (d.children) {
    if (lineage.includes(d.id)) {
      d.children.forEach((item) => collapse(item, lineage));
    } else {
      d._children = d.children;
      d._children.forEach((item) => collapse(item, lineage));
      d.children = null;
    }
  }
}
function expandAll(root) {
  expand(root);
}
function collapseAll(root, lineage) {
  root._children = root.children;
  let child = root.children.find((node) => lineage.includes(node.id));
  if (child) {
    root.children = [child];
  } else {
    root.children = null;
  }
  collapse(root, lineage);
}

// Collect all node IDs by DFS (or BFS).
function collectAllNodeIds(node, acc = []) {
  if (!node) return acc;
  acc.push(node.id);
  if (node.children) {
    node.children.forEach((child) => collectAllNodeIds(child, acc));
  }
  return acc;
}

export default function OrgChartTree() {
  const [treeDimensions, setTreeDimensions] = useState({ x: 0, y: 0 });
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const treeRef = useRef(null);

  const [pairingData, setPairingData] = useState(null);
  const [nameData, setNameData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [treeAction, setTreeAction] = useState(null);
  const [treeKey, setTreeKey] = useState(0);
  const [change, setChange] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchNode, setSearchNode] = useState(null);

  // For lineage
  const [lineage, setLineage] = useState([]);
  const [lineageView, setLineageView] = useState(false);

  // For suggestions
  const [allNodeIds, setAllNodeIds] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // Pledge/brother
  const [isPledge, setIsPledge] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    setUserEmail(Cookies.get("userEmail"));
  }, []);

  useEffect(() => {
    const checkIfBrother = async () => {
      const { data, error } = await supabase
        .from("Brothers")
        .select("*")
        .eq("email", userEmail);
      if (data?.length === 1 && !error) {
        setIsPledge(false);
      }
    };
    const checkIfPledge = async () => {
      const { data, error } = await supabase
        .from("Pledges")
        .select("*")
        .eq("email", userEmail);
      if (data?.length === 1 && !error) {
        setIsPledge(true);
      }
    };
    checkIfBrother();
    checkIfPledge();
  }, [userEmail]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("BigLittlePairings")
        .select("*");
      if (error) {
        console.error("Error fetching data:", error);
      } else {
        setPairingData(data);
      }
    };
    const fetchData2 = async () => {
      const { data, error } = await supabase.from("Brothers").select("*");
      if (error) {
        console.error("Error fetching data:", error);
      } else {
        setNameData(data);
      }
    };
    fetchData();
    fetchData2();
  }, []);

  useEffect(() => {
    if (pairingData !== null && nameData !== null) {
      let tempData = pairingData.map((item) =>
        item.biguserid === null
          ? { ...item, biguserid: "Theta Gamma" }
          : item
      );
      tempData = tempData.map((item) => {
        const found_little = nameData.find(
          (el) => el.userid === item.littleuserid
        );
        const found_big = nameData.find((el) => el.userid === item.biguserid);
        if (!found_big) {
          return {
            ...item,
            littleuserid: `${found_little.firstname} ${found_little.lastname}`,
          };
        } else {
          return {
            ...item,
            littleuserid: `${found_little.firstname} ${found_little.lastname}`,
            biguserid: `${found_big.firstname} ${found_big.lastname}`,
          };
        }
      });
      // Add extra row so "Theta Gamma" becomes root
      tempData = [...tempData, { biguserid: "", littleuserid: "Theta Gamma" }];

      const root = d3
        .stratify()
        .id((d) => d.littleuserid)
        .parentId((d) => d.biguserid)(tempData);

      setChartData(root);
    }
  }, [pairingData, nameData]);

  // Once chartData is set, gather all node IDs for suggestions
  useEffect(() => {
    if (chartData) {
      const ids = collectAllNodeIds(chartData);
      setAllNodeIds(ids);
    }
  }, [chartData]);

  useEffect(() => {
    if (!treeRef.current) return;
    const { width, height } = treeRef.current.getBoundingClientRect();
    setTreeDimensions({ x: width, y: height });
    setTranslate({ x: width / 2, y: height / 4 });
  }, [treeRef.current]);

  useEffect(() => {
    if (chartData && treeAction !== null) {
      const root = chartData;
      if (treeAction === 1) {
        expandAll(root);
      } else {
        collapseAll(root);
      }
      setChartData(root);
      setTreeKey((k) => k + 1);
    }
  }, [change]);

  function handleExpand(key) {
    setTreeAction(key);
    setChange(!change);
  }

  function findLineage(node, acc = []) {
    if (!node) return [];
    const newAcc = [node.id, ...acc];
    return node.parent ? findLineage(node.parent, newAcc) : newAcc;
  }

  // Existing search logic
  function search(e) {
    e.preventDefault();
    setLineage(null);
    if (chartData && searchQuery) {
      // You do an exact match here
      const foundNode = chartData.find(
        (node) =>
          (node.id ? node.id.toLowerCase() : node.id) ===
          searchQuery.toLowerCase()
      );
      const lineageIds = findLineage(foundNode);
      setLineage(lineageIds);
      if (foundNode) {
        setSearchNode(searchQuery);
      } else {
        setSearchNode(null);
      }
    }
  }

  // Suggestion logic: as user types, filter allNodeIds
  const handleSearchQueryChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val) {
      setSuggestions([]);
      return;
    }
    const lowerVal = val.toLowerCase();
    const filtered = allNodeIds
      .filter((id) => id.toLowerCase().includes(lowerVal))
      .slice(0, 5);
    setSuggestions(filtered);
  };

  // When a user clicks a suggestion, fill the input and optionally auto-search
  const handleSuggestionClick = (name) => {
    setSearchQuery(name);
    setSuggestions([]);
    // Optional: call your existing search logic if you want immediate highlighting:
    // e.g. replicate `searchNodeByName(name)` or just set a flag to do it next time
  };

  function handleLineageView() {
    setLineageView(!lineageView);
  }

  useEffect(() => {
    if (chartData) {
      const root = chartData;
      if (lineageView) {
        collapseAll(root, lineage);
      } else {
        expandAll(root);
      }
      setChartData(root);
      setTreeKey((k) => k + 1);
    }
  }, [lineageView]);

  const RenderRectSvgNode = ({ nodeDatum, toggleNode }) => {
    const words = nodeDatum.id.split(" ");
    const highlighted =
      searchNode?.toLowerCase() === nodeDatum.id?.toLowerCase();
    const inLineage = lineage && lineage.includes(nodeDatum.id);

    return (
      <g onClick={toggleNode}>
        <circle
          fill={highlighted ? "maroon" : "gold"}
          stroke={highlighted ? "gold" : "maroon"}
          r="60"
        />
        {words.map((word, index) => (
          <text
            key={index}
            fill={highlighted ? "gold" : "maroon"}
            stroke="none"
            textAnchor="middle"
            y={-6 + index * 20}
            style={{ fontFamily: "Montserrat, sans-serif", fontSize: "20px" }}
          >
            {word}
          </text>
        ))}
      </g>
    );
  };

  const containerStyle = {
    height: "100vh",
    width: "75vw",
    overflow: "auto",
    position: "relative", // for suggestion panel if you want absolute
  };

  return (
    <div className="flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020]">
      {isPledge ? (
        <BroNavBar isPledge={true} />
      ) : (
        <BroNavBar isPledge={false} />
      )}
      <div className="flex md:flex-row flex-col flex-grow border-b-2 border-[#a3000020] lg:w-3/4">
        <div>
          <div className="flex justify-center items-center h-16">
            <h1 className="text-red-700 text-2xl font-bold">
              Theta Gamma Family Tree
            </h1>
          </div>
          <p>Search a name to highlight it. Check the box to trace lineage.</p>
          <div className="flex items-center space-x-2 relative">
            {/* SEARCH FORM */}
            <form className="flex flex-row items-center" onSubmit={search}>
              <input
                className="border border-yellow-500 p-1 rounded-md text-sm
                  focus:outline-none focus:border-yellow-600
                  bg-yellow-50 placeholder-yellow-700"
                type="text"
                value={searchQuery}
                onChange={handleSearchQueryChange}
                placeholder="Search Node"
              />
              <button
                className="bg-red-700 hover:bg-red-800 text-yellow-300 py-1 px-3 rounded text-sm"
                type="submit"
              >
                Search
              </button>
            </form>

            {/* SUGGESTIONS DROPDOWN (if any) */}
            {suggestions.length > 0 && (
              <div
                className="absolute top-10 left-0 bg-white border border-gray-200 rounded-md z-10 w-48
                           shadow-md"
                style={{ maxHeight: "200px", overflowY: "auto" }}
              >
                {suggestions.map((item) => (
                  <div
                    key={item}
                    className="cursor-pointer hover:bg-gray-100 p-2"
                    onClick={() => handleSuggestionClick(item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}

            {/* EXPAND ALL BUTTON */}
            <button
              onClick={() => handleExpand(1)}
              className="bg-red-700 hover:bg-red-800 text-yellow-300  py-1 px-3 rounded text-sm"
            >
              Expand All
            </button>

            {/* LINEAGE VIEW CHECKBOX */}
            <label className="flex items-center space-x-2">
              <span>Lineage View</span>
              <input
                type="checkbox"
                checked={lineageView}
                onChange={handleLineageView}
              />
            </label>
          </div>

          {/* TREE CONTAINER */}
          <div ref={treeRef} style={containerStyle}>
            {chartData && (
              <Tree
                key={treeKey}
                data={chartData}
                translate={translate}
                orientation="vertical"
                renderCustomNodeElement={RenderRectSvgNode}
                zoomable
                zoom={0.1}
                draggable
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
