package plant.dev.logplant.serviec.impl;

import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;
import plant.dev.com.cmm.dao.AbstractDAO;
import plant.dev.com.cmm.exception.CustomException;
import plant.dev.com.cmm.util.map.CustomMap;
import plant.dev.logplant.serviec.LogPlantService;

import java.util.List;

@Service("LogPlantService")
public class LogPlantServiceImpl implements LogPlantService {

    @Resource(name = "abstractDAO")
    private AbstractDAO abstractDAO;

    @Override
    public List<CustomMap> getPlantLog() throws CustomException {
        List<CustomMap> flatLogList = abstractDAO.selectList("logplantDAO.findlogs");
        return flatLogList;
    }
}
