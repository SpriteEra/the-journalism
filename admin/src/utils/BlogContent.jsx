const Img = ({ url, caption }) => {
  return (
    <div>
      <img
        src={url}
        alt="Img"
        width={1200}
        height={400}
        sizes={{
          maxWidth: "100%",
          height: "auto",
        }}
        className="max-h-[500px] object-contain w-full h-full"
      />{" "}
      {caption.length ? (
        <p className="w-full text-center my-1 md:mb-12 text-[15px] italic sm:text-[16px]">
          {caption}
        </p>
      ) : (
        ""
      )}
    </div>
  );
};
const Quote = ({ quote, caption }) => {
  return (
    <div className="bg-purple/10 p-3 pl-5 border-l-4 border-purple font-anekdevanagari">
      <p className="text-xl leading-10 md:text-2xl font-anekdevanagari">
        {quote}
      </p>
      {caption.length ? (
        <p className="w-full text-purple text-base font-anekdevanagari">
          {caption}
        </p>
      ) : (
        ""
      )}
    </div>
  );
};
const List = ({ style, items }) => {
  return (
    <ol
      className={`pl-5 ${
        style === "ordered" ? " list-decimal" : " list-disc"
      } text-fg`}
    >
      {items.map((item, i) => {
        return (
          <li
            key={i}
            className="my-1 font-anekdevanagari"
            dangerouslySetInnerHTML={{ __html: item?.content }}
          ></li>
        );
      })}
    </ol>
  );
};

const LinkTool = ({ data }) => {
  const { link } = data;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="text-fg font-semibold underline"
      // className="block border rounded-md p-4 shadow-sm hover:shadow-md transition-all duration-200 bg-surface text-danger"
    >
      {link}
      {/* <div className="flex items-center gap-4">
        {meta?.image?.url && (
          <img
            src={meta.image.url}
            alt="Link Preview"
            className="w-20 h-20 object-cover rounded"
          />
        )}

        <div className="flex flex-col">
          <h4 className="text-lg font-semibold text-primary hover:underline">
            {meta?.title || link}
          </h4>
          <p className="text-sm text-fg-muted mt-1 line-clamp-2">
            {meta?.description || "No description available"}
          </p>
          <span className="text-xs text-fg-subtle mt-1">{link}</span>
        </div>
      </div> */}
    </a>
  );
};

const Delimiter = () => {
  return (
    <div className="w-full text-center my-6 space-x-2">
      <span className="text-4xl text-fg-muted select-none">
        *
      </span>
      <span className="text-4xl text-fg-muted select-none">
        *
      </span>
      <span className="text-4xl text-fg-muted select-none">
        *
      </span>
      <span className="text-4xl text-fg-muted select-none">
        *
      </span>
      <span className="text-4xl text-fg-muted select-none">
        *
      </span>
    </div>
  );
};

const Embed = ({ data }) => {
  const { embed, caption, service } = data;
  return (
    <div className="w-full my-6">
      <div className="aspect-video w-full max-w-3xl mx-auto rounded overflow-hidden">
        <iframe
          src={embed}
          title={service}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
      {caption && (
        <p className="text-center text-sm text-fg-subtle mt-2 font-anekdevanagari">
          {caption}
        </p>
      )}
    </div>
  );
};

const BlogContent = ({ block }) => {
  let { type, data } = block;
  if (type === "paragraph") {
    const alignment = data?.tunes?.alignmentTune?.alignment || "left"; // default to left

    return (
      <p
        dangerouslySetInnerHTML={{ __html: data.text }}
        className={`text-[18px] md:text-[20px] font-anekdevanagari opacity-[0.9] text-${alignment}`}
      ></p>
    );
  }

  if (type === "header") {
    if (data.level === 3) {
      return (
        <h3
          className="text-2xl font-bold font-anekdevanagari"
          dangerouslySetInnerHTML={{ __html: data.text }}
        ></h3>
      );
    }
    return (
      <h2
        className="text-3xl font-bold font-anekdevanagari"
        dangerouslySetInnerHTML={{ __html: data.text }}
      ></h2>
    );
  }
  if (type === "image") {
    return <Img url={data.file.url} caption={data.caption} />;
  }
  if (type === "quote") {
    return <Quote quote={data.quote} caption={data.caption} />;
  }
  if (type === "delimiter") {
    return <Delimiter />;
  }
  if (type === "list") {
    return <List style={data.style} items={data.items} />;
  }
  if (type === "embed") {
    return <Embed data={block.data} />;
  }
  if (type === "linkTool") {
    return <LinkTool data={data} />;
  } else {
    return <h1></h1>;
  }
};

const NewsContent = ({ item }) => {
  return item?.title?.length ? (
    <div className="w-full">
      {item.content[0].blocks.map((block, i) => {
        return (
          <div key={i}>
            <div className="my-4 md:my-4">
              <BlogContent block={block} />
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <></>
  );
};

export default NewsContent;
