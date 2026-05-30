"use client"

import Navbar from "@/app/navbar";
import {useEffect, useState} from "react";
import axios from "axios";
import {Card, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import Link from "next/link";
import {SearchIcon, Star} from "lucide-react";
import {NativeSelect, NativeSelectOption} from "@/components/ui/native-select";
import {Label} from "@/components/ui/label";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/input-group";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/components/ui/carousel";
import {Badge} from "@/components/ui/badge";
import {cn} from "@/lib/utils";
import {
  Pagination,
  PaginationContent, PaginationEllipsis,
  PaginationItem,
  PaginationLink, PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {RichTextEditor} from "@/components/ui/rich-text-editor";
import {Input} from "@/components/ui/input";

// Define type for user object 
type User = {
  userId: number;
  username: string;
}

// Define type for profile object
type Profile = {
  user: User;
  avatar: string;
  firstname: string;
  lastname: string;
}

// Define type for Search Threads object returned by API
type Thread = {
  threadId: number;
  profile: Profile;
  threadName: string;
  timestamp: string;
  threadContent: string;
  like: number;
}

// Export the default page component rendered at the /threads route
export default function Page() {
  // State to hold the current page
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State to hold the total pages
  const [totalPages, setTotalPages] = useState<number>(1);

  // State to hold the fetched Search Threads
  const [threads, setThreads] = useState<Thread[]>([]);
  
  // State to hold the thread name
  const [threadName, setThreadName] = useState("");
  
  // State to hold the thread content
  const [threadContent, setThreadContent] = useState("");
  
  // State to hold the creating topic
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  
  //
  const { push } = useRouter();

  // State to hold the user
  const [user, setUser] = useState<User | null>(null);
  
  // Triggers data fetching function on page load
  useEffect(() => {
    searchThreads();
    fetchUser();
  }, []);

  // Get current logged in information
  async function fetchUser() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await axios.get("http://localhost:8000/current_user", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      console.log(response);
      setUser(response.data);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        localStorage.removeItem("accessToken");
        setUser(null);
        return;
      }
      console.error(error);
    }
  }

  // Async function to fetch Search Threads from API
  async function searchThreads(page: number = 1) {
    if (page >= 1) {
      setCurrentPage(page);
    }
    try {
      // Send a GET resquest to the search threads endpoint using the id from the URL
      const response = await axios.get("http://localhost:8000/threads", {
        headers: {
          "Accept": 'application/json'
        },
        params: {
          page: page,      // Request the first page of result
          size: 8,     // Limit results to 8 search movies
        }
      });
      // Get the item array from the Search Threads responses and store it in state
      setThreads(response.data.items as Thread[]);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error(error);
    }
  }

  // Async function to create a Thread 
  async function createThread() {
    try {
      // Send a GET request to the search threads endpoint using the id from the URL
      const response = await axios.post("http://localhost:8000/threads", {
        threadName,
        threadContent
      }, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("accessToken"),
          Accept: "application/json",
        },
      });
      setThreadName("");
      setThreadContent("");
      setIsCreatingTopic(false);
      push('/discussions/' + response.data.threadId);
    } catch (error) {
      console.error(error);
    }
  }
  
  
  return (
    <div className="mx-auto">
      <Navbar/>
      <div className="m-5">
        <h1 className="text-4xl font-bold">Discussion Forum</h1>
      </div>
      
      <div className="py-5 mx-5 mb-10">
        {isCreatingTopic ? (
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-2">
              <Label htmlFor="threadName">Topic Title</Label>
              <Input id="threadName"
                     className="bg-white"
                     value={threadName}
                     placeholder="Type your topic's title here"
                     onChange={e => setThreadName(e.target.value)} />
            </div>
            <RichTextEditor className="bg-white" 
                            value={threadContent} 
                            onChange={value => setThreadContent(value)} />
            <div className="flex gap-5">
              <Button className="bg-orange-400 hover:bg-orange-800 w-50"
                      disabled={!threadName || !threadContent}
                      onClick={e => createThread()}>
                Create Topic
              </Button>
              <Button variant="secondary" className="w-50"
                      onClick={e => setIsCreatingTopic(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : user != null ? (
          <Button className="bg-orange-400 hover:bg-orange-800" 
                  onClick={e => setIsCreatingTopic(true)}>
            New Topic
          </Button>
        ) : (
          <div className="text-lg">
            Please login to create new topic!
          </div>
        )}
      </div>
      
      <Table className="w-full">
        <TableBody>
          {threads.map(thread => (
            <TableRow key={thread.threadId} className="p-5">
              <TableCell className="flex gap-5">
                <Link href={"/discussions/" + thread.threadId} className="h-20 w-20">
                  <img src={thread.profile.avatar} alt={thread.profile.user.username}
                       className="h-full w-full object-cover"/>
                </Link>
                
                <div>
                  <Link className="font-bold text-lg" href={"/discussions/" + thread.threadId}>{thread.threadName}</Link>
                  <div className="flex">
                    <div className="mr-9">{thread.profile.user.username}</div>
                    <div className="mr-9">{thread.timestamp}</div>
                  </div>
                </div>

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        
      </Table>

      <Pagination className="mt-15 mb-10">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" aria-disabled={currentPage <= 1}
                                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                                onClick={() => searchThreads(currentPage - 1)}/>
          </PaginationItem>
          {Array.from({length: totalPages}, (_, index) => index + 1).map(page => (
            <PaginationItem key={page}>
              <PaginationLink href="#"
                              isActive={page === currentPage} onClick={() => searchThreads(page)}>
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href="#" aria-disabled={currentPage >= totalPages}
                            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                            onClick={() => searchThreads(currentPage + 1)}/>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

    </div>
  )
}
